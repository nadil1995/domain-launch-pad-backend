'use client';

import { useState } from 'react';
import type { Folder } from '@/lib/types';

interface FolderTreeProps {
  folders: Folder[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface FolderNodeProps {
  folder: Folder;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  depth: number;
}

function FolderNode({ folder, selectedId, onSelect, depth }: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center space-x-1 py-2 px-2 cursor-pointer rounded transition ${
          selectedId === folder.id
            ? 'bg-brand-card border-l-2 border-indigo-500 text-indigo-400'
            : 'text-slate-300 hover:text-white hover:bg-brand-card'
        }`}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-slate-500 hover:text-slate-300"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="w-4"></span>}
        <span className="text-sm font-medium truncate">📁 {folder.name}</span>
      </div>

      {expanded && hasChildren && (
        <div className="ml-2 border-l border-brand-border">
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({ folders, selectedId, onSelect }: FolderTreeProps) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <h3 className="text-lg font-semibold text-white mb-4">📂 Folders</h3>

      <div
        className={`flex items-center space-x-2 py-2 px-2 cursor-pointer rounded transition ${
          selectedId === null ? 'bg-brand-card border-l-2 border-indigo-500 text-indigo-400' : 'text-slate-300 hover:text-white hover:bg-brand-card'
        }`}
        onClick={() => onSelect(null)}
      >
        <span className="text-sm font-medium">📚 All Scores</span>
      </div>

      <div className="mt-2 space-y-0">
        {folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            selectedId={selectedId}
            onSelect={onSelect}
            depth={0}
          />
        ))}
      </div>

      {folders.length === 0 && (
        <p className="text-sm text-slate-500 py-4">No folders yet</p>
      )}
    </div>
  );
}
