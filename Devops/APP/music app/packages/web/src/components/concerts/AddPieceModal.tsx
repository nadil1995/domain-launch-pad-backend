'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Score, ScoreVersion } from '@/lib/types';

interface AddPieceModalProps {
  concertId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPieceModal({
  concertId,
  onClose,
  onSuccess,
}: AddPieceModalProps) {
  const [step, setStep] = useState<'select-score' | 'select-version'>('select-score');
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [versions, setVersions] = useState<ScoreVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ScoreVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load scores on mount
  useEffect(() => {
    const loadScores = async () => {
      setLoading(true);
      try {
        const data = await api.getScores();
        setScores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scores');
      } finally {
        setLoading(false);
      }
    };

    loadScores();
  }, []);

  const filteredScores = scores.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.composer && s.composer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectScore = async (score: Score) => {
    setSelectedScore(score);
    setLoading(true);
    setError(null);

    try {
      const data = await api.getScoreVersions(score.id);
      setVersions(data);
      // Default to pinned or latest
      const pinned = data.find((v: ScoreVersion) => v.pinned);
      setSelectedVersion(pinned || data[0] || null);
      setStep('select-version');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPiece = async () => {
    if (!selectedScore || !selectedVersion) return;

    setLoading(true);
    setError(null);

    try {
      await api.addPieceToConcert(concertId, selectedScore.id, selectedVersion.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add piece');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'select-score' ? 'Add Piece to Concert' : `Add Piece: ${selectedScore?.title}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {step === 'select-score' ? (
            <>
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or composer..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                {filteredScores.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No scores found</p>
                ) : (
                  filteredScores.map((score) => (
                    <button
                      key={score.id}
                      onClick={() => handleSelectScore(score)}
                      disabled={loading}
                      className="w-full text-left px-3 py-2 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition disabled:opacity-50"
                    >
                      <p className="font-medium text-gray-900">{score.title}</p>
                      {score.composer && (
                        <p className="text-sm text-gray-600">by {score.composer}</p>
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Version</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {versions.map((version: ScoreVersion) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left px-3 py-2 rounded border transition ${
                        selectedVersion?.id === version.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      disabled={loading}
                    >
                      <p className="font-medium text-gray-900">
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
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setStep('select-score');
                    setSelectedScore(null);
                    setSelectedVersion(null);
                    setSearchQuery('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleAddPiece}
                  disabled={loading || !selectedVersion}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Piece'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
