import sharp from "sharp";
import type { ConvertOptions, ConvertResult, OutputFormat } from "./types.js";

/**
 * Handle all Sharp-native conversions:
 *   PNG/JPG/WEBP/HEIC/HEIF/TIFF/RAW/DNG -> PNG/JPG/WEBP
 *   SVG -> PNG/JPG/WEBP (rasterization via libvips/librsvg)
 */
export async function sharpConvert(
  input: Buffer,
  outputFormat: OutputFormat,
  options: ConvertOptions = {}
): Promise<ConvertResult> {
  let pipeline = sharp(input);

  // Resize if requested
  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to target format
  const normalizedOutput = outputFormat === "jpeg" ? "jpg" : outputFormat;

  switch (normalizedOutput) {
    case "webp":
      pipeline = pipeline.webp({
        quality: options.quality ?? 80,
        lossless: options.lossless ?? false,
      });
      break;
    case "png":
      pipeline = pipeline.png({
        compressionLevel: 6,
      });
      break;
    case "jpg":
      pipeline = pipeline.jpeg({
        quality: options.quality ?? 85,
        mozjpeg: true,
      });
      break;
    default:
      throw new Error(`Unsupported output format for sharp: ${outputFormat}`);
  }

  const outputBuffer = await pipeline.toBuffer();
  const metadata = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    format: normalizedOutput,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    size: outputBuffer.length,
  };
}
