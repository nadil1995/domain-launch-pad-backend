import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { generalLimiter, authLimiter } from "./middleware/rateLimit.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { keysRouter } from "./routes/keys.js";
import { convertRouter } from "./routes/convert.js";
import { batchRouter } from "./routes/batch.js";
import { usageRouter } from "./routes/usage.js";
import { docsRouter } from "./routes/docs.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(generalLimiter);

// API documentation (no rate limit)
app.use("/api/docs", docsRouter);

// Routes
app.use("/api/v1", healthRouter);
app.use("/api/v1", authLimiter, authRouter);
app.use("/api/v1", keysRouter);
app.use("/api/v1", convertRouter);
app.use("/api/v1", batchRouter);
app.use("/api/v1", usageRouter);

export { app };
