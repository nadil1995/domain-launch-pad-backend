import { Router, Request, Response } from "express";
import { requireJwt } from "../middleware/auth.js";
import { prisma } from "../lib/db.js";

const usageRouter = Router();

/**
 * GET /api/v1/usage
 * Returns usage stats for the authenticated user.
 * Query params:
 *   - period: "day" | "month" (default "month")
 *   - from: ISO date string (default: 30 days ago)
 *   - to: ISO date string (default: now)
 */
usageRouter.get("/usage", requireJwt, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const from = req.query.from
      ? new Date(req.query.from as string)
      : new Date(now.getFullYear(), now.getMonth(), 1); // start of current month
    const to = req.query.to ? new Date(req.query.to as string) : now;

    // Total counts in period
    const records = await prisma.usageRecord.findMany({
      where: {
        userId: req.userId!,
        createdAt: { gte: from, lte: to },
      },
      select: {
        inputFormat: true,
        outputFormat: true,
        inputBytes: true,
        outputBytes: true,
        durationMs: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate: totals
    const totalConversions = records.length;
    const totalInputBytes = records.reduce((s, r) => s + r.inputBytes, 0);
    const totalOutputBytes = records.reduce(
      (s, r) => s + (r.outputBytes ?? 0),
      0
    );
    const avgDurationMs =
      records.length > 0
        ? Math.round(
            records.reduce((s, r) => s + (r.durationMs ?? 0), 0) /
              records.length
          )
        : 0;

    // Breakdown by output format
    const byFormat: Record<string, number> = {};
    for (const r of records) {
      byFormat[r.outputFormat] = (byFormat[r.outputFormat] || 0) + 1;
    }

    // Daily breakdown
    const byDay: Record<string, number> = {};
    for (const r of records) {
      const day = r.createdAt.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }

    // Current month count (for quota display)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthCount = await prisma.usageRecord.count({
      where: {
        userId: req.userId!,
        createdAt: { gte: monthStart },
      },
    });

    res.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        totalConversions,
        totalInputBytes,
        totalOutputBytes,
        avgDurationMs,
        currentMonthCount,
      },
      byFormat,
      byDay,
    });
  } catch (err) {
    console.error("Usage error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { usageRouter };
