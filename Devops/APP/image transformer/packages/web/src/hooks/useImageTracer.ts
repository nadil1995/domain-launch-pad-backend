import { useState, useCallback, useRef, useEffect } from 'react';
import type { TracingOptions, PresetName } from '../types';
import { fileToDataUrl, dataUrlToImageData } from '../lib/imageUtils';
import { traceImageData, DEFAULT_OPTIONS } from '../lib/tracer';
import ImageTracer from 'imagetracerjs';

export function useImageTracer() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetName>('default');
  const [options, setOptions] = useState<TracingOptions>(DEFAULT_OPTIONS);

  const imageDataRef = useRef<ImageData | null>(null);

  const processImage = useCallback(async (imgData: ImageData, opts: TracingOptions) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Defer to next frame so the UI can show the spinner
      await new Promise((r) => setTimeout(r, 0));
      const svg = traceImageData(imgData, opts);
      setSvgString(svg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tracing failed');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFile = useCallback(async (newFile: File) => {
    if (!newFile.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setFile(newFile);
    setError(null);
    setSvgString(null);

    try {
      const dataUrl = await fileToDataUrl(newFile);
      setPreviewUrl(dataUrl);
      const imgData = await dataUrlToImageData(dataUrl);
      imageDataRef.current = imgData;
      await processImage(imgData, options);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load image');
    }
  }, [options, processImage]);

  const changePreset = useCallback((newPreset: PresetName) => {
    setPreset(newPreset);
    const presetOpts = ImageTracer.optionpresets[newPreset] || {};
    const merged = { ...DEFAULT_OPTIONS, ...presetOpts } as TracingOptions;
    setOptions(merged);
    if (imageDataRef.current) {
      processImage(imageDataRef.current, merged);
    }
  }, [processImage]);

  const updateOption = useCallback(<K extends keyof TracingOptions>(key: K, value: TracingOptions[K]) => {
    setPreset('default');
    setOptions((prev) => {
      const next = { ...prev, [key]: value };
      if (imageDataRef.current) {
        processImage(imageDataRef.current, next);
      }
      return next;
    });
  }, [processImage]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return {
    file,
    previewUrl,
    svgString,
    isProcessing,
    error,
    preset,
    options,
    handleFile,
    changePreset,
    updateOption,
  };
}
