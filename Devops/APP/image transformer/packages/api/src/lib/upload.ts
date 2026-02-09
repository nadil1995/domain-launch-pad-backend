import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { config } from "../config.js";

// Ensure temp dir exists
fs.mkdirSync(config.upload.tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: config.upload.tempDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

/** Single file upload middleware (field name: "file") */
export const uploadSingle = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
}).single("file");

/** Multi-file upload middleware (field name: "files", max 20) */
export const uploadMultiple = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
}).array("files", 20);

/** Clean up a temp file (fire-and-forget) */
export function cleanupTempFile(filepath: string): void {
  fs.unlink(filepath, () => {});
}
