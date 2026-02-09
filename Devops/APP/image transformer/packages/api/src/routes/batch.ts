import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { requireApiKey } from "../middleware/auth.js";
import { convertLimiter } from "../middleware/rateLimit.js";
import { enforceQuota } from "../middleware/quota.js";
import { uploadMultiple, cleanupTempFile } from "../lib/upload.js";
import { getPresignedDownloadUrl } from "../lib/s3.js";
import { AppError } from "../services/auth.js";
import { prisma } from "../lib/db.js";
import { conversionQueue } from "../queue/conversion.queue.js";
import type { OutputFormat } from "../services/converters/types.js";

const batchRouter = Router();

/**
 * POST /api/v1/convert/batch
 * Multi-file async conversion via BullMQ queue.
 * Returns batch ID + job IDs immediately (HTTP 202).
 */
batchRouter.post(
  "/convert/batch",
  requireApiKey,
  enforceQuota,
  convertLimiter,
  uploadMultiple,
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const tempPaths: string[] = [];

    try {
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Missing "files" field in multipart upload' });
        return;
      }

      const outputFormat = (req.body.outputFormat || req.query.outputFormat) as
        | OutputFormat
        | undefined;
      if (!outputFormat) {
        res.status(400).json({ error: "Missing outputFormat parameter" });
        return;
      }

      const options = {
        quality: parseOptionalInt(req.body.quality ?? req.query.quality),
        width: parseOptionalInt(req.body.width ?? req.query.width),
        height: parseOptionalInt(req.body.height ?? req.query.height),
        fit: req.body.fit ?? req.query.fit,
      };

      const batchId = crypto.randomUUID();
      const webhookUrl = req.body.webhookUrl || undefined;

      // Create DB records + enqueue jobs
      const jobResults = await Promise.all(
        files.map(async (file) => {
          tempPaths.push(file.path);

          // Create job in DB
          const dbJob = await prisma.job.create({
            data: {
              userId: req.userId!,
              inputFormat: file.mimetype,
              outputFormat,
              fileSize: file.size,
              webhookUrl,
              inputKey: `batch/${batchId}/${file.originalname}`,
            },
          });

          // Enqueue to BullMQ
          await conversionQueue.add(
            `convert-${dbJob.id}`,
            {
              jobId: dbJob.id,
              userId: req.userId!,
              filePath: file.path,
              originalName: file.originalname,
              outputFormat,
              batchId,
              webhookUrl,
              options,
            },
            {
              jobId: dbJob.id, // dedup key
            }
          );

          return { id: dbJob.id, status: dbJob.status, originalName: file.originalname };
        })
      );

      res.status(202).json({
        batchId,
        jobCount: jobResults.length,
        jobs: jobResults,
      });
    } catch (err) {
      // Clean up temp files on error
      tempPaths.forEach(cleanupTempFile);
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      console.error("Batch error:", err);
      res.status(500).json({ error: "Batch conversion failed" });
    }
  }
);

/**
 * GET /api/v1/jobs/:id
 * Poll a single job's status. Returns download URL when completed.
 */
batchRouter.get(
  "/jobs/:id",
  requireApiKey,
  async (req: Request, res: Response) => {
    try {
      const jobId = req.params.id as string;
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId: req.userId! },
        select: {
          id: true,
          status: true,
          inputFormat: true,
          outputFormat: true,
          fileSize: true,
          outputKey: true,
          error: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
        },
      });

      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      let downloadUrl: string | null = null;
      if (job.status === "COMPLETED" && job.outputKey) {
        try {
          downloadUrl = await getPresignedDownloadUrl(job.outputKey);
        } catch {
          downloadUrl = null;
        }
      }

      res.json({ ...job, downloadUrl });
    } catch (err) {
      console.error("Job status error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

function parseOptionalInt(val: unknown): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : Math.round(n);
}

export { batchRouter };
