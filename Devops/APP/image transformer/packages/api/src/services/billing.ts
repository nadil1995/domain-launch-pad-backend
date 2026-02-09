import Stripe from "stripe";
import { config } from "../config.js";
import { prisma } from "../lib/db.js";

const stripe = config.stripe.secretKey
  ? new Stripe(config.stripe.secretKey)
  : null;

function ensureStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  }
  return stripe;
}

/**
 * Create a Stripe customer for a new user and store the customer ID.
 * Called during signup. Non-fatal: if Stripe isn't configured, skip silently.
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<void> {
  if (!stripe) return; // Stripe not configured, skip

  try {
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });
  } catch (err) {
    console.error("Failed to create Stripe customer:", err);
    // Non-fatal: user can still use free tier
  }
}

/**
 * Create a metered subscription for a user upgrading to PAY_AS_YOU_GO.
 */
export async function createMeteredSubscription(
  userId: string
): Promise<{ subscriptionId: string; clientSecret: string | null } | null> {
  const s = ensureStripe();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    throw new Error("User has no Stripe customer ID");
  }

  if (!config.stripe.priceId) {
    throw new Error("STRIPE_METERED_PRICE_ID not configured");
  }

  const subscription = await s.subscriptions.create({
    customer: user.stripeCustomerId,
    items: [{ price: config.stripe.priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  await prisma.user.update({
    where: { id: userId },
    data: { plan: "PAY_AS_YOU_GO" },
  });

  // Extract client secret for frontend payment confirmation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoice = subscription.latest_invoice as any;
  const clientSecret = invoice?.payment_intent?.client_secret ?? null;

  return { subscriptionId: subscription.id, clientSecret };
}

/**
 * Report a single conversion to Stripe metered billing.
 * Called after each successful conversion for PAY_AS_YOU_GO users.
 */
export async function reportUsageToStripe(userId: string): Promise<void> {
  if (!stripe) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId || user.plan !== "PAY_AS_YOU_GO") return;

  try {
    // Find the active metered subscription item
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    const sub = subscriptions.data[0];
    if (!sub) return;

    const meteredItem = sub.items.data.find(
      (item) => item.price.id === config.stripe.priceId
    );
    if (!meteredItem) return;

    // Report 1 conversion unit via billing meter event
    await stripe.billing.meterEvents.create({
      event_name: "image_conversion",
      payload: {
        stripe_customer_id: user.stripeCustomerId!,
        value: "1",
      },
    });
  } catch (err) {
    console.error("Failed to report usage to Stripe:", err);
    // Non-fatal: don't block the conversion
  }
}
