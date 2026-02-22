import { prisma } from "../lib/db.js";

/* ── Plan pricing constants ─────────────────────────────── */

const PLAN_PRICE: Record<string, number> = {
  FREE: 0,
  STARTER: 5,
  PRO: 9,
  BUSINESS: 19,
  PAY_AS_YOU_GO: 0,
};

const PAYG_RATE = 0.01;

/* ── Helper ─────────────────────────────────────────────── */

export function parseDateRange(
  from?: string,
  to?: string,
  defaultDays = 30
): { from: Date; to: Date } {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - defaultDays * 24 * 60 * 60 * 1000);
  return { from: fromDate, to: toDate };
}

/* ── Overview ───────────────────────────────────────────── */

export interface OverviewResult {
  totalUsers: number;
  paidUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  totalConversions: number;
  conversionsThisMonth: number;
  totalDataProcessedBytes: number;
  mrr: number;
  paygRevenueThisMonth: number;
}

export async function getOverview(): Promise<OverviewResult> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    paidUsers,
    activeUsers7dRaw,
    activeUsers30dRaw,
    totalConversions,
    conversionsThisMonth,
    dataProcessed,
    planDistribution,
    paygConversionsThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: { not: "FREE" } } }),
    prisma.usageRecord.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.usageRecord.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.usageRecord.count(),
    prisma.usageRecord.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.usageRecord.aggregate({
      _sum: { inputBytes: true, outputBytes: true },
    }),
    prisma.user.groupBy({ by: ["plan"], _count: { id: true } }),
    prisma.usageRecord.count({
      where: {
        createdAt: { gte: monthStart },
        user: { plan: "PAY_AS_YOU_GO" },
      },
    }),
  ]);

  const totalDataProcessedBytes =
    (dataProcessed._sum.inputBytes || 0) +
    (dataProcessed._sum.outputBytes || 0);

  let mrr = 0;
  for (const p of planDistribution) {
    mrr += (PLAN_PRICE[p.plan] || 0) * p._count.id;
  }

  const paygRevenueThisMonth = paygConversionsThisMonth * PAYG_RATE;

  return {
    totalUsers,
    paidUsers,
    activeUsers7d: activeUsers7dRaw.length,
    activeUsers30d: activeUsers30dRaw.length,
    totalConversions,
    conversionsThisMonth,
    totalDataProcessedBytes,
    mrr: Math.round((mrr + paygRevenueThisMonth) * 100) / 100,
    paygRevenueThisMonth: Math.round(paygRevenueThisMonth * 100) / 100,
  };
}

/* ── User Analytics ─────────────────────────────────────── */

export interface UserAnalyticsResult {
  planDistribution: { plan: string; count: number }[];
  userGrowth: { date: string; total: number; cumulative: number }[];
  topUsers: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    conversions: number;
    lastActive: string | null;
  }[];
  total: number;
}

export async function getUserAnalytics(params: {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<UserAnalyticsResult> {
  const range = parseDateRange(params.from, params.to);
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  const [planDist, total, signups, usersBeforeRange, topUsersRaw] =
    await Promise.all([
      prisma.user.groupBy({ by: ["plan"], _count: { id: true } }),
      prisma.user.count(),
      prisma.user.findMany({
        where: { createdAt: { gte: range.from, lte: range.to } },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.count({ where: { createdAt: { lt: range.from } } }),
      prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { usageRecords: { _count: "desc" } },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          _count: { select: { usageRecords: true } },
          usageRecords: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
    ]);

  const planDistribution = planDist.map((p) => ({
    plan: p.plan,
    count: p._count.id,
  }));

  // Build daily growth with cumulative
  const dailyMap: Record<string, number> = {};
  for (const u of signups) {
    const day = u.createdAt.toISOString().slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  }
  let cumulative = usersBeforeRange;
  const userGrowth = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => {
      cumulative += total;
      return { date, total, cumulative };
    });

  const topUsers = topUsersRaw.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    plan: u.plan,
    conversions: u._count.usageRecords,
    lastActive:
      u.usageRecords.length > 0
        ? u.usageRecords[0].createdAt.toISOString()
        : null,
  }));

  return { planDistribution, userGrowth, topUsers, total };
}

/* ── Conversion Analytics ───────────────────────────────── */

export interface ConversionAnalyticsResult {
  byDay: { date: string; count: number }[];
  byFormat: { format: string; count: number }[];
  byPlan: { plan: string; count: number }[];
  avgDurationMs: number;
  avgInputBytes: number;
  avgOutputBytes: number;
  total: number;
}

export async function getConversionAnalytics(params: {
  from?: string;
  to?: string;
}): Promise<ConversionAnalyticsResult> {
  const range = parseDateRange(params.from, params.to);
  const where = { createdAt: { gte: range.from, lte: range.to } };

  const [records, aggregates, total] = await Promise.all([
    prisma.usageRecord.findMany({
      where,
      select: {
        inputFormat: true,
        outputFormat: true,
        createdAt: true,
        user: { select: { plan: true } },
      },
    }),
    prisma.usageRecord.aggregate({
      where,
      _avg: { durationMs: true, inputBytes: true, outputBytes: true },
    }),
    prisma.usageRecord.count({ where }),
  ]);

  // By day
  const dayMap: Record<string, number> = {};
  const formatMap: Record<string, number> = {};
  const planMap: Record<string, number> = {};

  for (const r of records) {
    const day = r.createdAt.toISOString().slice(0, 10);
    dayMap[day] = (dayMap[day] || 0) + 1;

    const fmt = `${r.inputFormat} → ${r.outputFormat}`;
    formatMap[fmt] = (formatMap[fmt] || 0) + 1;

    const plan = r.user.plan;
    planMap[plan] = (planMap[plan] || 0) + 1;
  }

  const byDay = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const byFormat = Object.entries(formatMap)
    .sort(([, a], [, b]) => b - a)
    .map(([format, count]) => ({ format, count }));

  const byPlan = Object.entries(planMap)
    .sort(([, a], [, b]) => b - a)
    .map(([plan, count]) => ({ plan, count }));

  return {
    byDay,
    byFormat,
    byPlan,
    avgDurationMs: Math.round(aggregates._avg.durationMs || 0),
    avgInputBytes: Math.round(aggregates._avg.inputBytes || 0),
    avgOutputBytes: Math.round(aggregates._avg.outputBytes || 0),
    total,
  };
}

/* ── Revenue Analytics ──────────────────────────────────── */

export interface RevenueAnalyticsResult {
  mrr: number;
  mrrByPlan: {
    plan: string;
    users: number;
    pricePerUser: number;
    revenue: number;
  }[];
  paygRevenueThisMonth: number;
  revenueOverTime: { date: string; mrr: number }[];
  paidUserGrowth: { date: string; count: number; cumulative: number }[];
}

export async function getRevenueAnalytics(params: {
  from?: string;
  to?: string;
}): Promise<RevenueAnalyticsResult> {
  const range = parseDateRange(params.from, params.to);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [planDist, paygConversionsThisMonth, paidSignups, paidBeforeRange] =
    await Promise.all([
      prisma.user.groupBy({ by: ["plan"], _count: { id: true } }),
      prisma.usageRecord.count({
        where: {
          createdAt: { gte: monthStart },
          user: { plan: "PAY_AS_YOU_GO" },
        },
      }),
      prisma.user.findMany({
        where: {
          plan: { not: "FREE" },
          createdAt: { gte: range.from, lte: range.to },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.count({
        where: {
          plan: { not: "FREE" },
          createdAt: { lt: range.from },
        },
      }),
    ]);

  // MRR by plan
  const mrrByPlan = planDist.map((p) => {
    const price = PLAN_PRICE[p.plan] || 0;
    return {
      plan: p.plan,
      users: p._count.id,
      pricePerUser: price,
      revenue: Math.round(price * p._count.id * 100) / 100,
    };
  });

  let mrr = 0;
  for (const p of mrrByPlan) {
    mrr += p.revenue;
  }

  const paygRevenueThisMonth =
    Math.round(paygConversionsThisMonth * PAYG_RATE * 100) / 100;

  // Revenue over time — approximate daily MRR snapshots by tracking paid user
  // sign-ups over time. For each day in range we compute accumulated paid
  // users × their plan prices. This is a simplified approximation since we
  // don't track plan changes.
  const allPaidUsers = await prisma.user.findMany({
    where: { plan: { not: "FREE" }, createdAt: { lte: range.to } },
    select: { plan: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const daySet = new Set<string>();
  let d = new Date(range.from);
  while (d <= range.to) {
    daySet.add(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  }

  const revenueOverTime: { date: string; mrr: number }[] = [];
  const sortedDays = Array.from(daySet).sort();
  for (const day of sortedDays) {
    const dayEnd = new Date(day + "T23:59:59.999Z");
    let dayMrr = 0;
    for (const u of allPaidUsers) {
      if (u.createdAt <= dayEnd) {
        dayMrr += PLAN_PRICE[u.plan] || 0;
      }
    }
    revenueOverTime.push({
      date: day,
      mrr: Math.round(dayMrr * 100) / 100,
    });
  }

  // Paid user growth
  const paidDailyMap: Record<string, number> = {};
  for (const u of paidSignups) {
    const day = u.createdAt.toISOString().slice(0, 10);
    paidDailyMap[day] = (paidDailyMap[day] || 0) + 1;
  }
  let cumulative = paidBeforeRange;
  const paidUserGrowth = Object.entries(paidDailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    });

  return {
    mrr: Math.round((mrr + paygRevenueThisMonth) * 100) / 100,
    mrrByPlan,
    paygRevenueThisMonth,
    revenueOverTime,
    paidUserGrowth,
  };
}

/* ── Legacy (backward compat for /admin/stats) ──────────── */

export async function getLegacyStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalConversions, planDistribution, recentUsers, usageRecords] =
    await Promise.all([
      prisma.user.count(),
      prisma.usageRecord.count(),
      prisma.user.groupBy({ by: ["plan"], _count: { id: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.usageRecord.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { inputFormat: true, outputFormat: true, createdAt: true },
      }),
    ]);

  // Signups by day (30d)
  const signups = await prisma.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  });
  const signupsByDay: Record<string, number> = {};
  for (const u of signups) {
    const day = u.createdAt.toISOString().slice(0, 10);
    signupsByDay[day] = (signupsByDay[day] || 0) + 1;
  }

  // Conversions by day (30d)
  const conversionsByDay: Record<string, number> = {};
  for (const r of usageRecords) {
    const day = r.createdAt.toISOString().slice(0, 10);
    conversionsByDay[day] = (conversionsByDay[day] || 0) + 1;
  }

  // Popular formats
  const popularFormats: Record<string, number> = {};
  for (const r of usageRecords) {
    const key = `${r.inputFormat} → ${r.outputFormat}`;
    popularFormats[key] = (popularFormats[key] || 0) + 1;
  }

  return {
    totalUsers,
    totalConversions,
    planDistribution: planDistribution.map((p) => ({
      plan: p.plan,
      count: p._count.id,
    })),
    signupsByDay,
    conversionsByDay,
    popularFormats,
    recentUsers,
  };
}
