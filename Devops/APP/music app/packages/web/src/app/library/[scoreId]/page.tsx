'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppLayout from '@/components/ui/AppLayout';
import ScoreViewer from '@/components/library/ScoreViewer';
import VersionList from '@/components/library/VersionList';
import AddVersionModal from '@/components/library/AddVersionModal';
import TagInput from '@/components/ui/TagInput';
import type { Score, ScoreVersion } from '@/lib/types';

export default function ScoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const scoreId = params.scoreId as string;
  const { user, isAuthenticated, isLoading } = useAuth();

  // Data state
  const [score, setScore] = useState<Score | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ScoreVersion | null>(null);

  // UI state
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [pendingTags, setPendingTags] = useState<string[]>([]);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load score data
  useEffect(() => {
    if (user && isAuthenticated && scoreId) {
      loadScore();
    }
  }, [user, isAuthenticated, scoreId]);

  const loadScore = async () => {
    try {
      setDataLoading(true);
      setError(null);
      const scoreData = await api.getScore(scoreId);
      setScore(scoreData);

      // Select pinned version or latest
      if (scoreData.versions && scoreData.versions.length > 0) {
        const pinned = scoreData.versions.find((v: ScoreVersion) => v.pinned);
        setSelectedVersion(pinned || scoreData.versions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load score');
    } finally {
      setDataLoading(false);
    }
  };

  const handlePin = async (versionId: string) => {
    try {
      setActionLoading(true);
      await api.pinScoreVersion(versionId);
      await loadScore();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin version');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (versionId: string) => {
    try {
      setActionLoading(true);
      await api.deleteScoreVersion(versionId);
      await loadScore();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete version');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddVersionSuccess = async () => {
    await loadScore();
  };

  const handleEditTags = () => {
    if (score) {
      setPendingTags([...score.tags]);
      setEditingTags(true);
    }
  };

  const handleSaveTags = async () => {
    if (!score) return;
    try {
      setActionLoading(true);
      await api.updateScore(score.id, undefined, undefined, pendingTags);
      await loadScore();
      setEditingTags(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tags');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTags = () => {
    setEditingTags(false);
    setPendingTags([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <div className="animate-spin">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'CONDUCTOR';

  if (dataLoading) {
    return (
      <AppLayout
        title="Loading..."
        action={
          <Link href="/library" className="text-indigo-400 hover:text-indigo-300 font-medium">
            ← Back to Library
          </Link>
        }
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!score) {
    return (
      <AppLayout
        title="Score Not Found"
        action={
          <Link href="/library" className="text-indigo-400 hover:text-indigo-300 font-medium">
            ← Back to Library
          </Link>
        }
      >
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-8 text-center">
          <p className="text-red-300 mb-4">The score you're looking for doesn't exist</p>
          <Link
            href="/library"
            className="inline-block px-6 py-2 bg-red-900/40 border border-red-800 text-red-300 rounded-lg hover:bg-red-900/60 transition-colors"
          >
            ← Back to Library
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={score.title}
      subtitle={score.composer ? `by ${score.composer}` : undefined}
      action={
        <div className="flex gap-4">
          <Link href="/library" className="text-indigo-400 hover:text-indigo-300 font-medium">
            ← Back to Library
          </Link>
          {selectedVersion && (
            <button
              onClick={() => setShowAddVersion(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              + Upload Version
            </button>
          )}
        </div>
      }
    >
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4">
          <p>{error}</p>
        </div>
      )}

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div>
          {/* Score metadata */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 mb-6">
            {/* Tags Section */}
            {editingTags ? (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-slate-300">Edit Tags</label>
                </div>
                <TagInput
                  tags={pendingTags}
                  onChange={setPendingTags}
                  disabled={actionLoading}
                  placeholder="Add or remove tags..."
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveTags}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-1 bg-green-900/40 text-green-300 border border-green-800 rounded text-sm hover:bg-green-900/60 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelTags}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-1 bg-slate-900/40 text-slate-300 border border-slate-700 rounded text-sm hover:bg-slate-900/60 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {(score.tags.length > 0 || isAdmin) && (
                  <div className="mb-4 flex justify-between items-start gap-2">
                    <div className="flex-1">
                      {score.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {score.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No tags yet</p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={handleEditTags}
                        disabled={actionLoading}
                        className="text-xs text-indigo-400 hover:text-indigo-300 whitespace-nowrap transition-colors disabled:opacity-50"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="border-t border-brand-border pt-4 space-y-3 text-sm">
              {score.folder && (
                <p>
                  <span className="text-slate-400">Folder:</span>{' '}
                  <span className="text-white font-medium">{score.folder.name}</span>
                </p>
              )}
              <p>
                <span className="text-slate-400">Versions:</span>{' '}
                <span className="text-white font-medium">
                  {score.versions?.length || 0}
                </span>
              </p>
              <p>
                <span className="text-slate-400">Added:</span>{' '}
                <span className="text-slate-300">
                  {new Date(score.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </p>
              <p>
                <span className="text-slate-400">Updated:</span>{' '}
                <span className="text-slate-300">
                  {new Date(score.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Version list */}
          {score.versions && score.versions.length > 0 && (
            <VersionList
              versions={score.versions}
              selectedId={selectedVersion?.id || null}
              onSelect={setSelectedVersion}
              onPin={handlePin}
              onDelete={handleDelete}
              onAddVersion={() => setShowAddVersion(true)}
              isAdmin={isAdmin}
              actionLoading={actionLoading}
            />
          )}
        </div>

        {/* Main viewer */}
        <div className="lg:col-span-3">
          <ScoreViewer version={selectedVersion} />
        </div>
      </div>

      {/* Add Version Modal */}
      {showAddVersion && (
        <AddVersionModal
          scoreId={scoreId}
          onClose={() => setShowAddVersion(false)}
          onSuccess={handleAddVersionSuccess}
        />
      )}
    </AppLayout>
  );
}
