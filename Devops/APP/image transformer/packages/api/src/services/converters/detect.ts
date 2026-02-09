import { fileTypeFromBuffer } from "file-type";
import { SUPPORTED_CONVERSIONS, MAX_FILE_SIZE } from "./types.js";
import type { InputFormat, OutputFormat } from "./types.js";
import { AppError } from "../auth.js";

/** Map MIME types / file-type results to our internal format names */
const MIME_TO_FORMAT: Record<string, InputFormat> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "image/x-canon-cr2": "cr2",
  "image/x-nikon-nef": "nef",
  "image/x-sony-arw": "arw",
  "image/x-adobe-dng": "dng",
};

/** Extension fallback for formats file-type can't detect (SVG, some RAW) */
const EXT_TO_FORMAT: Record<string, InputFormat> = {
  ".svg": "svg",
  ".pdf": "pdf",
  ".cr2": "cr2",
  ".nef": "nef",
  ".arw": "arw",
  ".dng": "dng",
  ".raw": "raw",
  ".heic": "heic",
  ".heif": "heif",
};

/**
 * Detect the input format from a file buffer + optional filename.
 * Uses magic bytes first, falls back to extension.
 */
export async function detectFormat(
  buffer: Buffer,
  filename?: string
): Promise<InputFormat> {
  // Try magic bytes
  const type = await fileTypeFromBuffer(buffer);
  if (type) {
    const mapped = MIME_TO_FORMAT[type.mime];
    if (mapped) return mapped;
  }

  // Fallback: check file extension
  if (filename) {
    const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
    const mapped = EXT_TO_FORMAT[ext];
    if (mapped) return mapped;
  }

  // Fallback: check if it's SVG (text-based, file-type can't detect)
  const head = buffer.slice(0, 512).toString("utf8").trim();
  if (head.startsWith("<") && (head.includes("<svg") || head.includes("<?xml"))) {
    return "svg";
  }

  throw new AppError(415, "Unsupported file format");
}

/**
 * Validate that a conversion from inputFormat to outputFormat is supported.
 */
export function validateConversion(
  inputFormat: InputFormat,
  outputFormat: OutputFormat
): void {
  const allowed = SUPPORTED_CONVERSIONS[inputFormat];
  if (!allowed) {
    throw new AppError(415, `Unsupported input format: ${inputFormat}`);
  }
  if (!allowed.includes(outputFormat)) {
    throw new AppError(
      422,
      `Cannot convert ${inputFormat} to ${outputFormat}. Supported outputs: ${allowed.join(", ")}`
    );
  }
}

/**
 * Validate file size.
 */
export function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new AppError(
      413,
      `File too large (${(size / 1024 / 1024).toFixed(1)}MB). Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }
}
