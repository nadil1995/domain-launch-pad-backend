'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="text-center">
        <div className="animate-spin mb-4">
          <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent"></div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">ScoreVault</h1>
        <p className="text-white/80">Music Notation Management</p>
      </div>
    </div>
  );
}
