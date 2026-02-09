import { Worker, Job } from "bullmq";
import fs from "node:fs/promises";
import { createRedisConnection } from "../lib/redis.js";
import { prisma } from "../lib/db.js";
import { uploadToS3 } from "../lib/s3.js";
import { convert } from "../services/converters/index.js";
import { reportUsageToStripe } from "../services/billing.js";
import { config } from "../config.js";
import type { ConversionJobData } from "./conversion.queue.js";
import type { OutputFormat, ConvertOptions } from "../services/converters/types.js";

export const QUEUE_NAME = "image-conversion";

/**
 * Creates and returns the conversion worker.
 * Processes jobs: read file -> convert -> upload to S3 -> update DB -> cleanup.
 */
export function createConversionWorker() {
  const worker = new Worker<ConversionJobData>(
    QUEUE_NAME,
    async (job: Job<ConversionJobData>) => {
      const { jobId, filePath, originalName, outputFormat, batchId, options } =
        job.data;

      // Mark as processing
      await prisma.job.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });

      const startTime = Date.now();

      // Read input file
      const inputBuffer = await fs.readFile(filePath);

      // Convert
      const result = await convert(
        inputBuffer,
        outputFormat as OutputFormat,
        options as ConvertOptions,
        originalName
      );

      // Upload result to S3
      const ext = result.format === "jpeg" ? "jpg" : result.format;
      const outputKey = `results/${batchId}/${jobId}.${ext}`;
      await uploadToS3(
        outputKey,
        result.buffer,
        `image/${result.format}`
      );

      const durationMs = Date.now() - startTime;

      // Update job as completed
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          outputKey,
          completedAt: new Date(),
        },
      });

      // Record usage
      await prisma.usageRecord.create({
        data: {
          userId: job.data.userId,
          jobId,
          inputFormat: originalName.split(".").pop() || "unknown",
          outputFormat,
          inputBytes: inputBuffer.length,
          outputBytes: result.size,
          durationMs,
        },
      });

      // Report to Stripe (non-blocking, non-fatal)
      reportUsageToStripe(job.data.userId).catch(() => {});

      // Cleanup temp file
      await fs.unlink(filePath).catch(() => {});

      return { outputKey, size: result.size, durationMs };
    },
    {
      connection: createRedisConnection(),
      concurrency: config.worker.concurrency,
    }
  );

  worker.on("failed", async (job, err) => {
    if (!job) return;
    const { jobId, filePath } = job.data;
    console.error(`Job ${jobId} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, err.message);

    // If all retries exhausted, mark as failed in DB
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await prisma.job
        .update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            error: err.message,
            completedAt: new Date(),
          },
        })
        .catch(() => {});

      // Cleanup temp file
      await fs.unlink(filePath).catch(() => {});
    }
  });

  worker.on("completed", (job) => {
    if (job) {
      console.log(`Job ${job.data.jobId} completed in ${job.returnvalue?.durationMs}ms`);
    }
  });

  return worker;
}
