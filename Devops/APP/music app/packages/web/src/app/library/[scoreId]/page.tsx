'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import ScoreViewer from '@/components/library/ScoreViewer';
import VersionList from '@/components/library/VersionList';
import AddVersionModal from '@/components/library/AddVersionModal';
import type { Score, ScoreVersion } from '@/lib/types';

export default function ScoreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const scoreId = params.scoreId as string;
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Data state
  const [score, setScore] = useState<Score | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ScoreVersion | null>(null);

  // UI state
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent"></div>
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
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">ScoreVault</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.name || user.email}</span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin">
            <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">ScoreVault</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.name || user.email}</span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 mb-4">Score not found</p>
            <button
              onClick={() => router.push('/library')}
              className="text-red-600 hover:text-red-800 underline"
            >
              ← Back to Library
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ScoreVault</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user.name || user.email}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {user.role}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Back button and title */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/library')}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            ← Back to Library
          </button>
          {selectedVersion && (
            <button
              onClick={() => setShowAddVersion(true)}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Upload new version
            </button>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div>
            {/* Score metadata */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{score.title}</h2>
              {score.composer && (
                <p className="text-gray-600 mb-4">by {score.composer}</p>
              )}

              {score.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {score.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                {score.folder && (
                  <p>
                    <span className="text-gray-600">Folder:</span>{' '}
                    <span className="text-gray-900 font-medium">{score.folder.name}</span>
                  </p>
                )}
                <p>
                  <span className="text-gray-600">Versions:</span>{' '}
                  <span className="text-gray-900 font-medium">
                    {score.versions?.length || 0}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Added:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(score.createdAt).toLocaleDateString()}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Updated:</span>{' '}
                  <span className="text-gray-900">
                    {new Date(score.updatedAt).toLocaleDateString()}
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
      </main>

      {/* Add Version Modal */}
      {showAddVersion && (
        <AddVersionModal
          scoreId={scoreId}
          onClose={() => setShowAddVersion(false)}
          onSuccess={handleAddVersionSuccess}
        />
      )}
    </div>
  );
}
