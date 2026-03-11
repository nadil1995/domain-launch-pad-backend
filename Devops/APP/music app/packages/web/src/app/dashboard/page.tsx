'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { Concert, Score } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
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
      <main className="max-w-7xl mx-auto py-12 px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.name || 'User'}!</h2>
          <p className="text-gray-600">Here's your ScoreVault dashboard</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upcoming Concerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Concerts</h3>
            {dataLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : concerts.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming concerts scheduled</p>
            ) : (
              <div className="space-y-3">
                {concerts.map((concert) => (
                  <div key={concert.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                    <h4 className="font-semibold text-gray-900 text-sm">{concert.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(concert.date).toLocaleDateString()}
                    </p>
                    {concert.location && (
                      <p className="text-xs text-gray-500">{concert.location}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => router.push('/concerts')}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded"
              >
                Manage Concerts
              </button>
            )}
          </div>

          {/* Recent Scores */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Scores</h3>
            {dataLoading ? (
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : scores.length === 0 ? (
              <p className="text-gray-500 text-sm">No scores uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {scores.map((score) => (
                  <div key={score.id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                    <h4 className="font-semibold text-gray-900 text-sm">{score.title}</h4>
                    {score.composer && (
                      <p className="text-xs text-gray-600">{score.composer}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(score.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push('/library')}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded"
            >
              View Library
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/library')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded transition"
              >
                Upload Score
              </button>
              {isAdmin && (
                <button
                  onClick={() => router.push('/concerts')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 rounded transition"
                >
                  Create Concert
                </button>
              )}
              <button
                onClick={() => router.push('/library')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm py-2 rounded transition"
              >
                Browse Library
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Scores</p>
            <p className="text-3xl font-bold text-gray-900">{scores.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Upcoming Concerts</p>
            <p className="text-3xl font-bold text-gray-900">{concerts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Your Role</p>
            <p className="text-3xl font-bold text-blue-600">{user.role}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
