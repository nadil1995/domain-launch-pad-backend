import { detectFormat, validateConversion, validateFileSize } from "./detect.js";
import { sharpConvert } from "./sharp-convert.js";
import { pdfConvert } from "./pdf-convert.js";
import { rasterToSvg } from "./svg-trace.js";
import type {
  InputFormat,
  OutputFormat,
  ConvertOptions,
  ConvertResult,
} from "./types.js";

export type { InputFormat, OutputFormat, ConvertOptions, ConvertResult };
export { SUPPORTED_CONVERSIONS, MAX_FILE_SIZE } from "./types.js";
export { detectFormat, validateConversion, validateFileSize };

/**
 * Main conversion entry point.
 * Detects format, validates the conversion pair, and dispatches to the right handler.
 */
export async function convert(
  input: Buffer,
  outputFormat: OutputFormat,
  options: ConvertOptions = {},
  filename?: string
): Promise<ConvertResult> {
  validateFileSize(input.length);

  const inputFormat = await detectFormat(input, filename);
  validateConversion(inputFormat, outputFormat);

  // Route to the correct handler
  if (outputFormat === "svg") {
    // Raster -> SVG tracing
    return rasterToSvg(input, options);
  }

  if (inputFormat === "pdf") {
    // PDF -> raster via canvas rendering
    return pdfConvert(input, outputFormat, options);
  }

  // Everything else: Sharp handles it
  // (PNG, JPG, WEBP, HEIC, HEIF, TIFF, SVG->raster, RAW/CR2/NEF/ARW/DNG)
  return sharpConvert(input, outputFormat, options);
}
