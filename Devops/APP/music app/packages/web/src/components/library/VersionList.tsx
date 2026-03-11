'use client';

import type { ScoreVersion } from '@/lib/types';

interface VersionListProps {
  versions: ScoreVersion[];
  selectedId: string | null;
  onSelect: (version: ScoreVersion) => void;
  onPin: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onAddVersion: () => void;
  isAdmin: boolean;
  actionLoading: boolean;
}

export default function VersionList({
  versions,
  selectedId,
  onSelect,
  onPin,
  onDelete,
  onAddVersion,
  isAdmin,
  actionLoading,
}: VersionListProps) {
  // Sort by version number descending (newest first)
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  const handleDeleteClick = (versionId: string) => {
    if (versions.length === 1) {
      alert('Cannot delete the last version of a score');
      return;
    }
    if (confirm('Are you sure you want to delete this version?')) {
      onDelete(versionId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Versions</h3>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {sorted.map((version) => (
          <div
            key={version.id}
            className={`p-3 border rounded cursor-pointer transition ${
              selectedId === version.id
                ? 'border-blue-600 bg-blue-50 border-l-2'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => !actionLoading && onSelect(version)}
          >
            <div className="flex justify-between items-start">
              <div
                className="flex-1"
                onClick={() => !actionLoading && onSelect(version)}
              >
                <p className="font-medium text-gray-900 text-sm">
                  v{version.versionNumber}
                  <span className="ml-2 text-xs font-normal bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {version.fileType}
                  </span>
                  {version.pinned && (
                    <span className="ml-2 text-xs text-yellow-600 font-semibold">
                      📌 Pinned
                    </span>
                  )}
                </p>
                {version.changeNotes && (
                  <p className="text-xs text-gray-600 mt-1">{version.changeNotes}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(version.createdAt).toLocaleDateString()}
                </p>
              </div>

              {isAdmin && (
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!version.pinned) {
                        onPin(version.id);
                      }
                    }}
                    disabled={version.pinned || actionLoading}
                    title={version.pinned ? 'Already pinned' : 'Pin this version'}
                    className="p-1 text-yellow-600 hover:bg-yellow-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📌
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(version.id);
                    }}
                    disabled={versions.length === 1 || actionLoading}
                    title={versions.length === 1 ? 'Cannot delete last version' : 'Delete version'}
                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAddVersion}
        disabled={actionLoading}
        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded disabled:opacity-50"
      >
        + Add version
      </button>
    </div>
  );
}
