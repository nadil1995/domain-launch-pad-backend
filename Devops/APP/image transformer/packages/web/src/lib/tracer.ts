import ImageTracer from 'imagetracerjs';
import type { TracingOptions } from '../types';

export function traceImageData(imageData: ImageData, options: TracingOptions): string {
  return ImageTracer.imagedataToSVG(imageData, options as unknown as Record<string, unknown>);
}

export const PRESET_NAMES = [
  'default',
  'posterized1',
  'posterized2',
  'posterized3',
  'curvy',
  'sharp',
  'detailed',
  'smoothed',
  'grayscale',
  'fixedpalette',
  'randomsampling1',
  'randomsampling2',
  'artistic1',
  'artistic2',
  'artistic3',
  'artistic4',
] as const;

export const DEFAULT_OPTIONS: TracingOptions = {
  ltres: 1,
  qtres: 1,
  pathomit: 8,
  rightangleenhance: true,
  colorsampling: 2,
  numberofcolors: 16,
  mincolorratio: 0,
  colorquantcycles: 3,
  strokewidth: 1,
  linefilter: false,
  scale: 1,
  roundcoords: 1,
  blurradius: 0,
  blurdelta: 20,
};
