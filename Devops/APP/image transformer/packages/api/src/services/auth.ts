import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { config } from "../config.js";
import { prisma } from "../lib/db.js";
import { createStripeCustomer } from "./billing.js";

const SALT_ROUNDS = 12;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

export async function signup(email: string, password: string, name?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });

  // Create Stripe customer in background (non-blocking, non-fatal)
  createStripeCustomer(user.id, email, name ?? undefined).catch(() => {});

  return { user: sanitizeUser(user), token: signToken(user.id) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  return { user: sanitizeUser(user), token: signToken(user.id) };
}

/** Generate a verification token, store its SHA-256 hash, return the raw token. */
export async function generateVerificationToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: hash,
      emailVerificationExpiry: expiry,
    },
  });

  return rawToken;
}

/** Verify email using the raw token from the link. */
export async function verifyEmail(rawToken: string) {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: hash },
  });

  if (!user) {
    throw new AppError(400, "Invalid verification token");
  }

  if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
    throw new AppError(400, "Verification token has expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  return { message: "Email verified successfully" };
}

/** Generate a password reset token. Always succeeds (don't leak email existence). */
export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return null; // Don't reveal that the email doesn't exist
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hash,
      passwordResetExpiry: expiry,
    },
  });

  return rawToken;
}

/** Reset password using the raw token from the email link. */
export async function resetPassword(rawToken: string, newPassword: string) {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const user = await prisma.user.findUnique({
    where: { passwordResetToken: hash },
  });

  if (!user) {
    throw new AppError(400, "Invalid reset token");
  }

  if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    throw new AppError(400, "Reset token has expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  return { message: "Password reset successfully" };
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function sanitizeUser(user: { id: string; email: string; name: string | null; plan: string; emailVerified: boolean }) {
  return { id: user.id, email: user.email, name: user.name, plan: user.plan, emailVerified: user.emailVerified };
}

// Simple typed error for expected failures
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}
