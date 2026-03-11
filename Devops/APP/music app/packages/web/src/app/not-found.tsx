'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-2xl font-semibold text-white">Page Not Found</p>
        </div>

        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist. It may have been moved or deleted.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/library"
            className="px-6 py-3 border border-brand-border text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/50 hover:bg-brand-surface rounded-lg transition-colors font-medium"
          >
            Go to Library
          </Link>
        </div>

        <div className="mt-12 text-slate-500">
          <p className="text-sm flex items-center justify-center gap-2">
            <span className="text-indigo-400">♪</span> ScoreVault
          </p>
        </div>
      </div>
    </div>
  );
}
