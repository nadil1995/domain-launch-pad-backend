import { createCanvas } from "canvas";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ConvertOptions, ConvertResult, OutputFormat } from "./types.js";
import { sharpConvert } from "./sharp-convert.js";

// Disable worker threads (we run server-side, single-threaded is fine)
GlobalWorkerOptions.workerSrc = "";

/**
 * PDF -> PNG/JPG/WEBP
 * Renders a PDF page to a canvas, extracts as PNG buffer, then runs through Sharp.
 */
export async function pdfConvert(
  input: Buffer,
  outputFormat: OutputFormat,
  options: ConvertOptions = {}
): Promise<ConvertResult> {
  const dpi = options.dpi ?? 150;
  const pageNum = options.page ?? 1;
  const scale = dpi / 72; // PDF default is 72 DPI

  const data = new Uint8Array(input);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;

  if (pageNum < 1 || pageNum > doc.numPages) {
    throw new Error(
      `Page ${pageNum} out of range (document has ${doc.numPages} pages)`
    );
  }

  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");

  // pdfjs render expects a CanvasRenderingContext2D-like object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (page.render as any)({
    canvasContext: ctx,
    viewport,
  }).promise;

  // Get PNG buffer from canvas, then pass to Sharp for final format conversion
  const pngBuffer = canvas.toBuffer("image/png");
  return sharpConvert(Buffer.from(pngBuffer), outputFormat, options);
}
