declare module "imagetracerjs" {
  interface ImageData {
    width: number;
    height: number;
    data: number[];
  }

  interface TracingOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    numberofcolors?: number;
    colorsampling?: number;
    blurradius?: number;
    blurdelta?: number;
    strokewidth?: number;
    scale?: number;
    roundcoords?: number;
    linefilter?: boolean;
    rightangleenhance?: boolean;
    mincolorratio?: number;
    colorquantcycles?: number;
  }

  function imagedataToSVG(imageData: ImageData, options?: TracingOptions): string;

  export default { imagedataToSVG };
}
