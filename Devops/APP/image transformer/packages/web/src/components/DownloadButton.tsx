import { saveAs } from 'file-saver';
import { Download, Clipboard, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
  svgString: string | null;
  fileName: string;
}

export function DownloadButton({ svgString, fileName }: Props) {
  const [copied, setCopied] = useState(false);

  if (!svgString) return null;

  const handleDownload = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const baseName = fileName.replace(/\.[^.]+$/, '');
    saveAs(blob, `${baseName}.svg`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(svgString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download SVG
      </button>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
        {copied ? 'Copied!' : 'Copy SVG'}
      </button>
    </div>
  );
}
