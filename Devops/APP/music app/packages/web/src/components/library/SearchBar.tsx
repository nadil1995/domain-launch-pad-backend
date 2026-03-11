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
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title or composer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {availableTags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`text-sm px-3 py-1 rounded transition ${
              activeTags.includes(tag)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}

        {availableTags.length === 0 && (
          <p className="text-sm text-gray-400">No tags available</p>
        )}
      </div>

      {(query || activeTags.length > 0) && (
        <button
          onClick={clearAll}
          className="mt-3 text-sm text-gray-600 hover:text-gray-900 underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
