import Redis from "ioredis";
import { config } from "../config.js";

/** Shared Redis connection for BullMQ */
export function createRedisConnection() {
  return new Redis.default(config.redis.url, {
    maxRetriesPerRequest: null, // required by BullMQ
  });
}
