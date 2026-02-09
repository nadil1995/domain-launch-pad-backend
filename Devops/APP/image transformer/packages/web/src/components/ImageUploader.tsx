import { useCallback, useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  hasImage: boolean;
}

export function ImageUploader({ onFile, hasImage }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
      } ${hasImage ? 'py-4' : 'py-12'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <Upload className={`mx-auto text-gray-400 ${hasImage ? 'h-6 w-6' : 'h-10 w-10'}`} />
      <p className={`mt-2 font-medium text-gray-700 ${hasImage ? 'text-sm' : 'text-base'}`}>
        {hasImage ? 'Drop or click to replace image' : 'Drop an image here or click to upload'}
      </p>
      {!hasImage && (
        <p className="mt-1 text-sm text-gray-500">Supports PNG, JPG, BMP, GIF, and more</p>
      )}
    </div>
  );
}
