import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/db.js";
import { config } from "../config.js";

/**
 * Middleware: enforce monthly conversion quota for FREE tier users.
 * PAY_AS_YOU_GO users are unlimited.
 * Must run AFTER auth middleware (req.userId must be set).
 */
export async function enforceQuota(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // PAY_AS_YOU_GO users have no quota limit
    if (user.plan === "PAY_AS_YOU_GO") {
      next();
      return;
    }

    // Count this month's conversions for FREE tier
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyCount = await prisma.usageRecord.count({
      where: {
        userId: req.userId,
        createdAt: { gte: monthStart },
      },
    });

    if (monthlyCount >= config.quotas.freeMonthlyConversions) {
      res.status(429).json({
        error: "Monthly conversion limit reached",
        limit: config.quotas.freeMonthlyConversions,
        used: monthlyCount,
        plan: user.plan,
        upgrade: "Upgrade to PAY_AS_YOU_GO for unlimited conversions",
      });
      return;
    }

    // Attach remaining quota to headers for client visibility
    res.set(
      "X-Quota-Remaining",
      String(config.quotas.freeMonthlyConversions - monthlyCount)
    );
    res.set("X-Quota-Limit", String(config.quotas.freeMonthlyConversions));

    next();
  } catch (err) {
    console.error("Quota check error:", err);
    // Fail open: allow the request if quota check fails
    next();
  }
}
