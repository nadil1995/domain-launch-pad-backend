'use client';

import type { ScoreVersion } from '@/lib/types';

interface ScoreViewerProps {
  version: ScoreVersion | null;
}

export default function ScoreViewer({ version }: ScoreViewerProps) {
  if (!version) {
    return (
      <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
        <p className="text-gray-600">No version selected</p>
      </div>
    );
  }

  if (!version.downloadUrl) {
    return (
      <div className="bg-white rounded-lg shadow p-8 border border-gray-200 text-center">
        <p className="text-gray-600">Loading file...</p>
        <div className="inline-block mt-4">
          <div className="animate-spin">
            <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Version {version.versionNumber} • {version.fileType}
        </p>
        {version.changeNotes && (
          <p className="text-sm text-gray-500 mt-1">{version.changeNotes}</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          {new Date(version.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="p-6">
        {version.fileType === 'PDF' ? (
          <iframe
            src={version.downloadUrl}
            className="w-full"
            style={{ height: '800px' }}
            title="Score PDF"
          />
        ) : version.fileType === 'IMAGE' ? (
          <div className="flex justify-center">
            <img
              src={version.downloadUrl}
              alt="Score"
              className="max-w-full h-auto rounded"
            />
          </div>
        ) : version.fileType === 'MUSICXML' ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">MusicXML files cannot be previewed in browser</p>
            <a
              href={version.downloadUrl}
              download
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Download MusicXML
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
