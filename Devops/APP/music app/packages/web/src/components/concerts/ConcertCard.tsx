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
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{concert.title}</h3>

        <p className="text-sm text-gray-600 mb-2">{formattedDate}</p>

        {concert.location && (
          <p className="text-sm text-gray-600 mb-3">{concert.location}</p>
        )}

        <div className="flex items-center gap-2">
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
            {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      </div>
    </Link>
  );
}
