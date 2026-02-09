export type InputFormat =
  | "png"
  | "jpg"
  | "jpeg"
  | "webp"
  | "heic"
  | "heif"
  | "svg"
  | "pdf"
  | "tiff"
  | "raw"
  | "cr2"
  | "nef"
  | "arw"
  | "dng";

export type OutputFormat = "png" | "jpg" | "jpeg" | "webp" | "svg";

export interface ConvertOptions {
  /** Output quality 1-100 (for lossy formats) */
  quality?: number;
  /** Resize width in px */
  width?: number;
  /** Resize height in px */
  height?: number;
  /** Resize fit mode */
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  /** DPI for PDF rasterization */
  dpi?: number;
  /** PDF page number (1-indexed) */
  page?: number;
  /** Lossless WEBP */
  lossless?: boolean;
}

export interface ConvertResult {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
}

/** Supported conversion pairs: input -> allowed outputs */
export const SUPPORTED_CONVERSIONS: Record<string, OutputFormat[]> = {
  png: ["webp", "jpg", "jpeg", "svg"],
  jpg: ["webp", "png", "svg"],
  jpeg: ["webp", "png", "svg"],
  webp: ["png", "jpg", "jpeg"],
  heic: ["jpg", "jpeg", "png", "webp"],
  heif: ["jpg", "jpeg", "png", "webp"],
  svg: ["png", "jpg", "jpeg", "webp"],
  pdf: ["png", "jpg", "jpeg", "webp"],
  tiff: ["png", "jpg", "jpeg", "webp"],
  raw: ["jpg", "jpeg", "png", "webp"],
  cr2: ["jpg", "jpeg", "png", "webp"],
  nef: ["jpg", "jpeg", "png", "webp"],
  arw: ["jpg", "jpeg", "png", "webp"],
  dng: ["jpg", "jpeg", "png", "webp"],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
