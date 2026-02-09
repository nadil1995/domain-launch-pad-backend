import { Router, Request, Response } from "express";
import fs from "node:fs/promises";
import { requireApiKey } from "../middleware/auth.js";
import { convertLimiter } from "../middleware/rateLimit.js";
import { enforceQuota } from "../middleware/quota.js";
import { uploadSingle, cleanupTempFile } from "../lib/upload.js";
import { convert } from "../services/converters/index.js";
import { reportUsageToStripe } from "../services/billing.js";
import { prisma } from "../lib/db.js";
import { AppError } from "../services/auth.js";
import type { OutputFormat, ConvertOptions } from "../services/converters/types.js";

const convertRouter = Router();

/** Content-type map for output formats */
const FORMAT_CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/**
 * POST /api/v1/convert
 * Single-file synchronous conversion.
 * Body: multipart/form-data with "file" field
 * Query/body params: outputFormat, quality, width, height, fit, dpi, page, lossless
 */
convertRouter.post(
  "/convert",
  requireApiKey,
  enforceQuota,
  convertLimiter,
  uploadSingle,
  async (req: Request, res: Response) => {
    const tempPath = req.file?.path;
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Missing "file" field in multipart upload' });
        return;
      }

      const outputFormat = (req.body.outputFormat || req.query.outputFormat) as
        | OutputFormat
        | undefined;
      if (!outputFormat) {
        res.status(400).json({
          error: "Missing outputFormat parameter (e.g. webp, png, jpg, svg)",
        });
        return;
      }

      const options: ConvertOptions = {
        quality: parseOptionalInt(req.body.quality ?? req.query.quality),
        width: parseOptionalInt(req.body.width ?? req.query.width),
        height: parseOptionalInt(req.body.height ?? req.query.height),
        fit: req.body.fit ?? req.query.fit,
        dpi: parseOptionalInt(req.body.dpi ?? req.query.dpi),
        page: parseOptionalInt(req.body.page ?? req.query.page),
        lossless: parseBool(req.body.lossless ?? req.query.lossless),
      };

      const inputBuffer = await fs.readFile(req.file.path);
      const result = await convert(
        inputBuffer,
        outputFormat,
        options,
        req.file.originalname
      );

      // Record usage + report to Stripe (non-blocking)
      const startTime = Date.now();
      const durationMs = Date.now() - startTime;
      if (req.userId) {
        prisma.usageRecord
          .create({
            data: {
              userId: req.userId,
              inputFormat: req.file.originalname.split(".").pop() || "unknown",
              outputFormat,
              inputBytes: inputBuffer.length,
              outputBytes: result.size,
              durationMs,
            },
          })
          .catch(() => {});
        reportUsageToStripe(req.userId).catch(() => {});
      }

      const contentType = FORMAT_CONTENT_TYPE[result.format] || "application/octet-stream";
      const ext = result.format === "jpeg" ? "jpg" : result.format;

      res
        .set("Content-Type", contentType)
        .set("Content-Length", String(result.size))
        .set(
          "Content-Disposition",
          `inline; filename="converted.${ext}"`
        )
        .set("X-Image-Width", String(result.width))
        .set("X-Image-Height", String(result.height))
        .send(result.buffer);
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("Conversion error:", err);
      res.status(500).json({ error: "Conversion failed" });
    } finally {
      if (tempPath) cleanupTempFile(tempPath);
    }
  }
);

function parseOptionalInt(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : Math.round(n);
}

function parseBool(val: unknown): boolean | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (val === "true" || val === "1" || val === true) return true;
  if (val === "false" || val === "0" || val === false) return false;
  return undefined;
}

export { convertRouter };
