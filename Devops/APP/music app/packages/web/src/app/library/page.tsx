'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppLayout from '@/components/ui/AppLayout';
import FolderTree from '@/components/library/FolderTree';
import ScoreCard from '@/components/library/ScoreCard';
import SearchBar from '@/components/library/SearchBar';
import UploadModal from '@/components/library/UploadModal';
import type { Folder, Score } from '@/lib/types';

export default function LibraryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

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

  return (
    <AppLayout
      title="Score Library"
      subtitle="Browse and manage your music scores"
      action={
        <button
          onClick={() => setShowUpload(true)}
          className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
        >
          + Upload Score
        </button>
      }
    >
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4">
          <p>{error}</p>
        </div>
      )}

      {/* Layout: Sidebar + Main */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div>
          {dataLoading ? (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
              <div className="space-y-2">
                <div className="h-4 bg-brand-card rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-brand-card rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-brand-card rounded w-2/3 animate-pulse"></div>
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
                <div key={i} className="bg-brand-surface border border-brand-border rounded-xl p-4">
                  <div className="h-6 bg-brand-card rounded w-3/4 animate-pulse mb-2"></div>
                  <div className="h-4 bg-brand-card rounded w-1/2 animate-pulse mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-brand-card rounded w-2/3 animate-pulse"></div>
                    <div className="h-3 bg-brand-card rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredScores.length === 0 ? (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-12 text-center">
              <p className="text-slate-400 text-lg">
                {allScores.length === 0
                  ? '📚 No scores yet. Upload your first score to get started!'
                  : '🔍 No scores match your filters.'}
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
    </AppLayout>
  );
}
