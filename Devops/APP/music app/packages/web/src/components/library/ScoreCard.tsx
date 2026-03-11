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
      className="bg-brand-surface border border-brand-border rounded-xl hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer p-4"
    >
      <h3 className="text-lg font-semibold text-white truncate">{score.title}</h3>

      {score.composer && (
        <p className="text-sm text-slate-400 mt-1 truncate">by {score.composer}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1">
        {score.tags.length > 0 ? (
          score.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-800 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500">No tags</span>
        )}
        {score.tags.length > 3 && (
          <span className="text-xs text-slate-500 px-2 py-1">+{score.tags.length - 3}</span>
        )}
      </div>

      <div className="mt-3 text-xs text-slate-400 space-y-1">
        <p>📋 {score.versions?.length || 0} version{(score.versions?.length || 0) !== 1 ? 's' : ''}</p>
        <p>📅 {new Date(score.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
      </div>
    </div>
  );
}
