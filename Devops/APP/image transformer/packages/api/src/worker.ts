import { config } from "./config.js";
import { createConversionWorker } from "./queue/conversion.worker.js";

const worker = createConversionWorker();

console.log(
  `ImageForge Worker started [concurrency=${config.worker.concurrency}]`
);

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
