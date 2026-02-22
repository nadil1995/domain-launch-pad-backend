import { Router, Request, Response, NextFunction } from "express";
import { requireJwt, requireAdmin } from "../middleware/auth.js";
import {
  getLegacyStats,
  getOverview,
  getUserAnalytics,
  getConversionAnalytics,
  getRevenueAnalytics,
} from "../services/analytics.js";

const adminRouter = Router();

adminRouter.use("/admin", requireJwt, requireAdmin);

/**
 * GET /api/v1/admin/stats
 * Legacy endpoint — backward compatible.
 */
adminRouter.get("/admin/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getLegacyStats();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/overview
 * KPI summary — flat JSON, BI-friendly.
 */
adminRouter.get("/admin/overview", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getOverview();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/users?from=&to=&limit=&offset=
 * User analytics with date range and pagination.
 */
adminRouter.get("/admin/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getUserAnalytics({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/conversions?from=&to=
 * Conversion analytics with date range.
 */
adminRouter.get("/admin/conversions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getConversionAnalytics({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/revenue?from=&to=
 * Revenue analytics with date range.
 */
adminRouter.get("/admin/revenue", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getRevenueAnalytics({
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export { adminRouter };
