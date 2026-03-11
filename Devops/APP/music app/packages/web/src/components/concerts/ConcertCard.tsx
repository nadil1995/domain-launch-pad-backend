'use client';

import Link from 'next/link';
import type { Concert } from '@/lib/types';

interface ConcertCardProps {
  concert: Concert;
}

export default function ConcertCard({ concert }: ConcertCardProps) {
  const formattedDate = new Date(concert.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const pieceCount = concert.pieces?.length || 0;

  return (
    <Link href={`/concerts/${concert.id}`}>
      <div className="bg-brand-surface border border-brand-border rounded-xl hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer p-6">
        <h3 className="text-lg font-bold text-white mb-2">{concert.title}</h3>

        <p className="text-sm text-slate-400 mb-2">📅 {formattedDate}</p>

        {concert.location && (
          <p className="text-sm text-slate-400 mb-3">📍 {concert.location}</p>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-brand-border">
          <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            🎵 {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </div>
    </Link>
  );
}
