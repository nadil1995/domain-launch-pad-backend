'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppLayout from '@/components/ui/AppLayout';
import ConcertCard from '@/components/concerts/ConcertCard';
import CreateConcertModal from '@/components/concerts/CreateConcertModal';
import type { Concert } from '@/lib/types';

export default function ConcertsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'CONDUCTOR');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadConcerts();
  }, [user, router]);

  const loadConcerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getConcerts();
      const sorted = data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setConcerts(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concerts');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AppLayout
      title="Concerts"
      subtitle="Manage your performances and setlists"
      action={
        isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
          >
            + New Concert
          </button>
        )
      }
    >
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-brand-surface border border-brand-border rounded-xl h-48 animate-pulse"
            />
          ))}
        </div>
      ) : concerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">🎭 No concerts yet</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Create the first concert
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      )}

      {/* Create concert modal */}
      {showCreate && (
        <CreateConcertModal
          onClose={() => setShowCreate(false)}
          onSuccess={loadConcerts}
        />
      )}
    </AppLayout>
  );
}
