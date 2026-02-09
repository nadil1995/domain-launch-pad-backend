import { Queue } from "bullmq";
import { createRedisConnection } from "../lib/redis.js";

export interface ConversionJobData {
  jobId: string;
  userId: string;
  filePath: string;        // temp file path on disk
  originalName: string;
  outputFormat: string;
  batchId: string;
  webhookUrl?: string;
  options: {
    quality?: number;
    width?: number;
    height?: number;
    fit?: string;
    dpi?: number;
    page?: number;
    lossless?: boolean;
  };
}

export const QUEUE_NAME = "image-conversion";

export const conversionQueue = new Queue<ConversionJobData>(QUEUE_NAME, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: { age: 24 * 3600 },  // keep completed jobs for 24h
    removeOnFail: { age: 7 * 24 * 3600 },  // keep failed jobs for 7 days
  },
});
