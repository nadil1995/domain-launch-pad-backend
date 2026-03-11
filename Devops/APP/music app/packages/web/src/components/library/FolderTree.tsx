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
            ? 'bg-blue-100 border-l-2 border-blue-600'
            : 'hover:bg-gray-50'
        }`}
        onClick={() => onSelect(folder.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="w-4"></span>}
        <span className="text-sm text-gray-700 font-medium truncate">{folder.name}</span>
      </div>

      {expanded && hasChildren && (
        <div className="ml-2 border-l border-gray-200">
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
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Folders</h3>

      <div
        className={`flex items-center space-x-2 py-2 px-2 cursor-pointer rounded transition ${
          selectedId === null ? 'bg-blue-100 border-l-2 border-blue-600' : 'hover:bg-gray-50'
        }`}
        onClick={() => onSelect(null)}
      >
        <span className="text-sm text-gray-700 font-medium">All Scores</span>
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
        <p className="text-sm text-gray-400 py-4">No folders yet</p>
      )}
    </div>
  );
}
