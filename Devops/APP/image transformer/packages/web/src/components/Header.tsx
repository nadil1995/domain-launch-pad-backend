import { Image } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <Image className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Image to SVG Converter</h1>
          <p className="text-sm text-gray-500">Convert raster images to scalable vector graphics in your browser</p>
        </div>
      </div>
    </header>
  );
}
