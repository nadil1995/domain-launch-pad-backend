'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Concert, ConcertPiece } from '@/lib/types';

interface SetlistEditorProps {
  concert: Concert;
  onReload: () => void;
  isAdmin: boolean;
}

export default function SetlistEditor({
  concert,
  onReload,
  isAdmin,
}: SetlistEditorProps) {
  const [pieces, setPieces] = useState<ConcertPiece[]>(
    [...(concert.pieces || [])].sort((a, b) => a.order - b.order)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newPieces = [...pieces];
    [newPieces[index - 1], newPieces[index]] = [newPieces[index], newPieces[index - 1]];

    setLoading(true);
    setError(null);

    try {
      const reorderData = newPieces.map((p, i) => ({
        pieceId: p.id,
        order: i + 1,
      }));
      await api.reorderPieces(concert.id, reorderData);
      setPieces(newPieces);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === pieces.length - 1) return;

    const newPieces = [...pieces];
    [newPieces[index], newPieces[index + 1]] = [newPieces[index + 1], newPieces[index]];

    setLoading(true);
    setError(null);

    try {
      const reorderData = newPieces.map((p, i) => ({
        pieceId: p.id,
        order: i + 1,
      }));
      await api.reorderPieces(concert.id, reorderData);
      setPieces(newPieces);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePiece = async (pieceId: string) => {
    if (!confirm('Remove this piece from the setlist?')) return;

    setLoading(true);
    setError(null);

    try {
      await api.removePieceFromConcert(concert.id, pieceId);
      setPieces(pieces.filter((p) => p.id !== pieceId));
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove piece');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-900 mb-4">Setlist</h2>

      {pieces.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No pieces in setlist yet</p>
      ) : (
        <div className="space-y-2">
          {pieces.map((piece, index) => (
            <div
              key={piece.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
            >
              <span className="font-semibold text-gray-700 w-6">{index + 1}.</span>

              <div className="flex-1">
                <p className="font-medium text-gray-900">{piece.score.title}</p>
                {piece.score.composer && (
                  <p className="text-sm text-gray-600">by {piece.score.composer}</p>
                )}
                <p className="text-xs text-gray-500">
                  v{piece.version.versionNumber} · {piece.version.fileType}
                </p>
              </div>

              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || loading}
                    title="Move up"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === pieces.length - 1 || loading}
                    title="Move down"
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemovePiece(piece.id)}
                    disabled={loading}
                    title="Remove piece"
                    className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
