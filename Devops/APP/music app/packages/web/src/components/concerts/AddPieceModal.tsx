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
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl max-w-md w-full">
        <div className="border-b border-brand-border p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            {step === 'select-score' ? '🎵 Add Piece' : `🎵 ${selectedScore?.title}`}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {step === 'select-score' ? (
            <>
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search by title or composer..."
                  className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                  disabled={loading}
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 border border-brand-border rounded-lg p-2">
                {filteredScores.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No scores found</p>
                ) : (
                  filteredScores.map((score) => (
                    <button
                      key={score.id}
                      onClick={() => handleSelectScore(score)}
                      disabled={loading}
                      className="w-full text-left px-3 py-2 rounded border border-brand-border hover:border-indigo-500/50 hover:bg-brand-card text-white transition disabled:opacity-50"
                    >
                      <p className="font-medium">{score.title}</p>
                      {score.composer && (
                        <p className="text-sm text-slate-400">by {score.composer}</p>
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-brand-border text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-brand-card rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Select Version</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-brand-border rounded-lg p-2">
                  {versions.map((version: ScoreVersion) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left px-3 py-2 rounded border transition ${
                        selectedVersion?.id === version.id
                          ? 'border-indigo-500 bg-indigo-900/20 text-white'
                          : 'border-brand-border hover:bg-brand-card text-slate-300 hover:text-white'
                      }`}
                      disabled={loading}
                    >
                      <p className="font-medium">
                        v{version.versionNumber}
                        <span className="ml-2 text-xs font-normal bg-brand-card text-slate-300 px-2 py-1 rounded border border-brand-border">
                          {version.fileType}
                        </span>
                        {version.pinned && (
                          <span className="ml-2 text-xs text-yellow-400 font-semibold">
                            📌 Pinned
                          </span>
                        )}
                      </p>
                      {version.changeNotes && (
                        <p className="text-xs text-slate-500 mt-1">{version.changeNotes}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setStep('select-score');
                    setSelectedScore(null);
                    setSelectedVersion(null);
                    setSearchQuery('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-brand-border text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-brand-card rounded-lg transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleAddPiece}
                  disabled={loading || !selectedVersion}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
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
