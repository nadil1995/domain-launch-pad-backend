'use client';

import { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TagInput({
  tags,
  onChange,
  disabled = false,
  placeholder = 'Add a tag and press Enter...',
}: TagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = input.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 bg-brand-card border border-brand-border rounded-lg p-3 min-h-12">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-2 bg-indigo-900/40 text-indigo-300 px-3 py-1 rounded border border-indigo-700 text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 hover:text-indigo-200 transition-colors"
              disabled={disabled}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-[100px] bg-transparent border-0 outline-none text-white placeholder:text-slate-500 disabled:opacity-50"
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">Press Enter or comma to add tags</p>
    </div>
  );
}
