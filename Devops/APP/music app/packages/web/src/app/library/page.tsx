'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import FolderTree from '@/components/library/FolderTree';
import ScoreCard from '@/components/library/ScoreCard';
import SearchBar from '@/components/library/SearchBar';
import UploadModal from '@/components/library/UploadModal';
import type { Folder, Score } from '@/lib/types';

export default function LibraryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [allScores, setAllScores] = useState<Score[]>([]);

  // Filters
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // UI
  const [showUpload, setShowUpload] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load data
  useEffect(() => {
    if (user && isAuthenticated) {
      loadData();
    }
  }, [user, isAuthenticated]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      const [foldersData, scoresData] = await Promise.all([
        api.getFolderTree(),
        api.getScores(),
      ]);

      setFolders(foldersData);
      setAllScores(scoresData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  // Filter scores
  const filteredScores = useMemo(() => {
    let result = allScores;

    // Filter by folder
    if (selectedFolderId) {
      result = result.filter((s) => s.folderId === selectedFolderId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.composer?.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (activeTags.length > 0) {
      result = result.filter((s) => activeTags.every((t) => s.tags.includes(t)));
    }

    return result;
  }, [allScores, selectedFolderId, searchQuery, activeTags]);

  // Collect all unique tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allScores.forEach((score) => {
      score.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allScores]);

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
        {/* Title and Actions */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Library</h2>
            <p className="text-gray-600 mt-1">Browse and manage your music scores</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Upload Score
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Layout: Sidebar + Main */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div>
            {dataLoading ? (
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <FolderTree
                folders={folders}
                selectedId={selectedFolderId}
                onSelect={setSelectedFolderId}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            {!dataLoading && (
              <div className="mb-6">
                <SearchBar
                  availableTags={availableTags}
                  onSearch={(query, tags) => {
                    setSearchQuery(query);
                    setActiveTags(tags);
                  }}
                />
              </div>
            )}

            {/* Scores Grid */}
            {dataLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredScores.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 border border-gray-200 text-center">
                <p className="text-gray-600 text-lg">
                  {allScores.length === 0
                    ? 'No scores yet. Upload your first score to get started!'
                    : 'No scores match your filters.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredScores.map((score) => (
                  <ScoreCard key={score.id} score={score} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          folders={folders}
          onClose={() => setShowUpload(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}
