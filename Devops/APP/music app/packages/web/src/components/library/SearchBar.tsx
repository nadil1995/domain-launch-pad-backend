'use client';

import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string, tags: string[]) => void;
  availableTags: string[];
}

export default function SearchBar({ onSearch, availableTags }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query, activeTags);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTags, onSearch]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAll = () => {
    setQuery('');
    setActiveTags([]);
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 Search by title or composer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`text-sm px-3 py-1 rounded-full transition ${
              activeTags.includes(tag)
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'bg-brand-card text-slate-300 border border-brand-border hover:border-indigo-500/50 hover:text-indigo-300'
            }`}
          >
            {tag}
          </button>
        ))}

        {availableTags.length === 0 && (
          <p className="text-sm text-slate-500">No tags available</p>
        )}
      </div>

      {(query || activeTags.length > 0) && (
        <button
          onClick={clearAll}
          className="mt-3 text-sm text-slate-400 hover:text-slate-300 transition-colors"
        >
          ✕ Clear all filters
        </button>
      )}
    </div>
  );
}
