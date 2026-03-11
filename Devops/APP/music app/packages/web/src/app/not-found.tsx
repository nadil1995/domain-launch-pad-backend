'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-xl text-gray-600">Page Not Found</p>
        </div>

        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist. It may have been moved or deleted.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/library"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Library
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mt-12 text-gray-400">
          <p className="text-sm">ScoreVault</p>
        </div>
      </div>
    </div>
  );
}
