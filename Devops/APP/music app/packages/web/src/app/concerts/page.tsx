'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
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
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Concerts</h2>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Concert
            </button>
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-lg h-48 animate-pulse"
              />
            ))}
          </div>
        ) : concerts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No concerts yet</p>
            {isAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
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
      </div>

      {/* Create concert modal */}
      {showCreate && (
        <CreateConcertModal
          onClose={() => setShowCreate(false)}
          onSuccess={loadConcerts}
        />
      )}
    </div>
  );
}
