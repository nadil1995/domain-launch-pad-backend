import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtExpiresIn: "7d",
  s3: {
    endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
    region: process.env.S3_REGION || "us-east-1",
    accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
    secretKey: process.env.S3_SECRET_KEY || "minioadmin",
    bucket: process.env.S3_BUCKET || "imageforge",
  },
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    tempDir: process.env.UPLOAD_TEMP_DIR || "/tmp/imageforge-uploads",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "3", 10),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    priceId: process.env.STRIPE_METERED_PRICE_ID || "", // metered price for per-conversion billing
  },
  quotas: {
    freeMonthlyConversions: 100,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    from: process.env.EMAIL_FROM || "ImageForge <noreply@imageforge.dev>",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || "",
} as const;
