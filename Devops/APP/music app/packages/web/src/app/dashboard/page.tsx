'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import AppLayout from '@/components/ui/AppLayout';
import type { Concert, Score } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && isAuthenticated) {
      loadDashboardData();
    }
  }, [user, isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      const [concertsData, scoresData] = await Promise.all([
        api.getConcerts(),
        api.getScores(),
      ]);

      // Sort concerts by date and get next 3
      const upcomingConcerts = concertsData
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

      // Get last 5 scores (most recent first)
      const recentScores = scoresData
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setConcerts(upcomingConcerts);
      setScores(recentScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setDataLoading(false);
    }
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

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user.name || 'User'}!`}
    >
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-800 text-red-300 rounded-lg p-4">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
          <p className="text-slate-400 text-sm mb-2">Total Scores</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {scores.length}
          </p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
          <p className="text-slate-400 text-sm mb-2">Upcoming Concerts</p>
          <p className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {concerts.length}
          </p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
          <p className="text-slate-400 text-sm mb-2">Your Role</p>
          <p className="text-3xl font-bold text-indigo-400">{user.role}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Concerts */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Concerts</h3>
          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-brand-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : concerts.length === 0 ? (
            <p className="text-slate-400 text-sm">No upcoming concerts scheduled</p>
          ) : (
            <div className="space-y-3">
              {concerts.map((concert) => (
                <button
                  key={concert.id}
                  onClick={() => router.push(`/concerts/${concert.id}`)}
                  className="w-full text-left border border-brand-border rounded-lg p-4 hover:border-indigo-500/50 hover:bg-brand-card transition-all group"
                >
                  <h4 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {concert.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(concert.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {concert.location && (
                    <p className="text-xs text-slate-500 mt-1">📍 {concert.location}</p>
                  )}
                </button>
              ))}
            </div>
          )}
          {isAdmin && (
            <button
              onClick={() => router.push('/concerts')}
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold py-2 rounded-lg transition-all"
            >
              Manage Concerts
            </button>
          )}
        </div>

        {/* Recent Scores */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Scores</h3>
          {dataLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-brand-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : scores.length === 0 ? (
            <p className="text-slate-400 text-sm">No scores uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {scores.map((score) => (
                <button
                  key={score.id}
                  onClick={() => router.push(`/library/${score.id}`)}
                  className="w-full text-left border border-brand-border rounded-lg p-4 hover:border-indigo-500/50 hover:bg-brand-card transition-all group"
                >
                  <h4 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {score.title}
                  </h4>
                  {score.composer && (
                    <p className="text-xs text-slate-400">by {score.composer}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(score.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push('/library')}
            className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold py-2 rounded-lg transition-all"
          >
            View Library
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/library')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition-all"
            >
              📤 Upload Score
            </button>
            {isAdmin && (
              <button
                onClick={() => router.push('/concerts')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 rounded-lg transition-all"
              >
                🎭 Create Concert
              </button>
            )}
            <button
              onClick={() => router.push('/library')}
              className="w-full border border-brand-border text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-brand-card text-sm font-semibold py-2 rounded-lg transition-all"
            >
              📚 Browse Library
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
