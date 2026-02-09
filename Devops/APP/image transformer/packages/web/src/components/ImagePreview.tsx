import { Loader2 } from 'lucide-react';

interface Props {
  previewUrl: string | null;
  svgString: string | null;
  isProcessing: boolean;
}

export function ImagePreview({ previewUrl, svgString, isProcessing }: Props) {
  if (!previewUrl) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Original</h3>
        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          <img
            src={previewUrl}
            alt="Original"
            className="max-h-96 object-contain"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">SVG Output</h3>
        <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="text-sm">Processing...</span>
            </div>
          ) : svgString ? (
            <div
              className="max-h-96 [&>svg]:max-h-96 [&>svg]:w-auto"
              dangerouslySetInnerHTML={{ __html: svgString }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
