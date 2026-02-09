export interface TracingOptions {
  // Tracing
  ltres: number;
  qtres: number;
  pathomit: number;
  rightangleenhance: boolean;

  // Color quantization
  colorsampling: number;
  numberofcolors: number;
  mincolorratio: number;
  colorquantcycles: number;

  // SVG rendering
  strokewidth: number;
  linefilter: boolean;
  scale: number;
  roundcoords: number;

  // Blur
  blurradius: number;
  blurdelta: number;
}

export type PresetName =
  | 'default'
  | 'posterized1'
  | 'posterized2'
  | 'posterized3'
  | 'curvy'
  | 'sharp'
  | 'detailed'
  | 'smoothed'
  | 'grayscale'
  | 'fixedpalette'
  | 'randomsampling1'
  | 'randomsampling2'
  | 'artistic1'
  | 'artistic2'
  | 'artistic3'
  | 'artistic4';

export interface TracerState {
  file: File | null;
  previewUrl: string | null;
  svgString: string | null;
  isProcessing: boolean;
  error: string | null;
  preset: PresetName;
  options: TracingOptions;
}
