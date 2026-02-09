declare module 'imagetracerjs' {
  interface ImageTracerStatic {
    imagedataToSVG(imgd: ImageData, options?: Record<string, unknown> | string): string;
    imageToSVG(url: string, callback: (svgString: string) => void, options?: Record<string, unknown> | string): void;
    optionpresets: Record<string, Record<string, unknown>>;
  }

  const ImageTracer: ImageTracerStatic;
  export default ImageTracer;
}
