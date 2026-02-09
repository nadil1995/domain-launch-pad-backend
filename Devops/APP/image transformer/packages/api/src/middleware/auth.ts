import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { config } from "../config.js";
import { prisma } from "../lib/db.js";

// Extend Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware: authenticate via Bearer JWT token.
 * Used for dashboard routes (signup → get token → use token).
 */
export function requireJwt(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware: authenticate via x-api-key header.
 * Used for conversion API endpoints.
 */
export async function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const key = req.headers["x-api-key"];
    if (typeof key !== "string" || !key) {
      res.status(401).json({ error: "Missing x-api-key header" });
      return;
    }

    const hash = crypto.createHash("sha256").update(key).digest("hex");

    const apiKey = await prisma.apiKey.findUnique({
      where: { hash },
      select: { id: true, userId: true, revokedAt: true },
    });

    if (!apiKey || apiKey.revokedAt) {
      res.status(401).json({ error: "Invalid or revoked API key" });
      return;
    }

    req.userId = apiKey.userId;

    // Fire-and-forget: update lastUsedAt
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    next();
  } catch (err) {
    console.error("API key auth error:", err);
    res.status(503).json({ error: "Authentication service unavailable" });
  }
}
