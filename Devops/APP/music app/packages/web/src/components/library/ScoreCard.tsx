'use client';

import { useRouter } from 'next/navigation';
import type { Score } from '@/lib/types';

interface ScoreCardProps {
  score: Score;
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/library/${score.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-4 border border-gray-200 hover:border-blue-300"
    >
      <h3 className="text-lg font-semibold text-gray-900 truncate">{score.title}</h3>

      {score.composer && (
        <p className="text-sm text-gray-600 mt-1 truncate">by {score.composer}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        {score.tags.length > 0 ? (
          score.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No tags</span>
        )}
        {score.tags.length > 3 && (
          <span className="text-xs text-gray-400 px-2 py-1">+{score.tags.length - 3}</span>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <p>Versions: {score.versions?.length || 0}</p>
        <p>Added {new Date(score.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
