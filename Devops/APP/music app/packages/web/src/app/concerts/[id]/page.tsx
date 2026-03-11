'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppLayout from '@/components/ui/AppLayout';
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
      <AppLayout
        title="Loading..."
        action={
          <Link href="/concerts" className="text-indigo-400 hover:text-indigo-300 font-medium">
            ← Back to Concerts
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

  if (!concert) {
    return (
      <AppLayout
        title="Concert Not Found"
        action={
          <Link href="/concerts" className="text-indigo-400 hover:text-indigo-300 font-medium">
            ← Back to Concerts
          </Link>
        }
      >
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-8 text-center">
          <p className="text-red-300 mb-4">The concert you're looking for doesn't exist</p>
          <Link
            href="/concerts"
            className="inline-block px-6 py-2 bg-red-900/40 border border-red-800 text-red-300 rounded-lg hover:bg-red-900/60 transition-colors"
          >
            ← Back to Concerts
          </Link>
        </div>
      </AppLayout>
    );
  }

  const formattedDate = new Date(concert.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <AppLayout
      title={concert.title}
      subtitle={formattedDate}
      action={
        <div className="flex gap-4">
          <Link href="/concerts" className="text-indigo-400 hover:text-indigo-300 font-medium">
            ← Back to Concerts
          </Link>
          {isAdmin && (
            <button
              onClick={() => setShowAddPiece(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
            >
              + Add Piece
            </button>
          )}
        </div>
      }
    >
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {concert.location && (
        <div className="mb-6 p-4 bg-brand-surface border border-brand-border rounded-lg">
          <p className="text-slate-300">📍 {concert.location}</p>
        </div>
      )}

      <SetlistEditor
        concert={concert}
        onReload={loadConcert}
        isAdmin={isAdmin || false}
      />

      {/* Add piece modal */}
      {showAddPiece && (
        <AddPieceModal
          concertId={concertId}
          onClose={() => setShowAddPiece(false)}
          onSuccess={loadConcert}
        />
      )}
    </AppLayout>
  );
}
