import { createCanvas, loadImage } from "canvas";
import sharp from "sharp";
import type { ConvertOptions, ConvertResult } from "./types.js";

// imagetracerjs is a CommonJS module
import ImageTracer from "imagetracerjs";

/**
 * Raster (PNG/JPG) -> SVG via imagetracerjs
 * Loads the image into a node-canvas, extracts ImageData, traces to SVG.
 */
export async function rasterToSvg(
  input: Buffer,
  options: ConvertOptions = {}
): Promise<ConvertResult> {
  // Ensure input is PNG for consistent canvas loading
  const pngBuf = await sharp(input).png().toBuffer();

  const img = await loadImage(pngBuf);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  const traceOptions = {
    ltres: 1,
    qtres: 1,
    pathomit: 8,
    numberofcolors: 16,
    ...((options.quality ?? 0) > 50
      ? { numberofcolors: 32, ltres: 0.5, qtres: 0.5 }
      : {}),
  };

  const svgString: string = ImageTracer.imagedataToSVG(
    {
      width: imageData.width,
      height: imageData.height,
      data: Array.from(imageData.data),
    },
    traceOptions
  );

  const svgBuffer = Buffer.from(svgString, "utf-8");

  return {
    buffer: svgBuffer,
    format: "svg",
    width: img.width,
    height: img.height,
    size: svgBuffer.length,
  };
}
