'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import SetlistEditor from '@/components/concerts/SetlistEditor';
import AddPieceModal from '@/components/concerts/AddPieceModal';
import type { Concert } from '@/lib/types';

export default function ConcertDetailPage() {
  const { user, logout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const concertId = params.id as string;

  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPiece, setShowAddPiece] = useState(false);

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'CONDUCTOR');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadConcert();
  }, [user, router, concertId]);

  const loadConcert = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getConcert(concertId);
      setConcert(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concert');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">ScoreVault</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
        </div>
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">ScoreVault</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/concerts"
            className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-block"
          >
            ← Back to Concerts
          </Link>
          <p className="text-gray-600">Concert not found</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(concert.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">ScoreVault</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={() => {
                api.setToken(null);
                router.push('/login');
              }}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/concerts"
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Concerts
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">{concert.title}</h1>
          <p className="text-gray-600 mt-2">{formattedDate}</p>
          {concert.location && (
            <p className="text-gray-600">{concert.location}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-gray-900">Setlist</h2>
          {isAdmin && (
            <button
              onClick={() => setShowAddPiece(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add piece
            </button>
          )}
        </div>

        <SetlistEditor
          concert={concert}
          onReload={loadConcert}
          isAdmin={isAdmin || false}
        />
      </div>

      {/* Add piece modal */}
      {showAddPiece && (
        <AddPieceModal
          concertId={concertId}
          onClose={() => setShowAddPiece(false)}
          onSuccess={loadConcert}
        />
      )}
    </div>
  );
}
