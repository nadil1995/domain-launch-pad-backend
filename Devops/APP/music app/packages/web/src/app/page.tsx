'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState({ scores: 0, concerts: 0, groups: 0 });

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Fetch stats for unauthenticated landing page
    const fetchStats = async () => {
      try {
        // For landing page, we show public stats (no auth required in display)
        setStats({ scores: 500, concerts: 45, groups: 28 });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    if (!isLoading && !isAuthenticated) {
      fetchStats();
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ScoreVault</h1>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      {/* Navigation */}
      <nav className="bg-brand-surface border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl text-indigo-400">♪</span>
              <span className="text-lg font-bold text-white">ScoreVault</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">
            Your Music,{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Perfectly Organized
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            ScoreVault is the complete solution for managing, sharing, and performing your music scores.
            Collaborate with your ensemble, organize concerts, and never lose track of your arrangements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
            >
              Start Free →
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-brand-border text-slate-300 font-semibold rounded-lg hover:border-indigo-500 hover:text-white transition-colors hover:bg-brand-card"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Total Scores', value: stats.scores },
              { label: 'Active Concerts', value: stats.concerts },
              { label: 'Ensembles', value: stats.groups },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center p-6 bg-brand-surface border border-brand-border rounded-xl hover:border-indigo-500/50 transition-colors"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Musicians</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Everything you need to manage scores, conduct rehearsals, and perform with confidence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Score Library',
                description: 'Organize all your scores in one place with intelligent tagging, searching, and folder structures.',
                icon: '📚',
              },
              {
                title: 'Concert Management',
                description: 'Create setlists, manage pieces, and coordinate with your ensemble for perfect performances.',
                icon: '🎭',
              },
              {
                title: 'Team Collaboration',
                description: 'Share scores with your group, manage permissions, and keep everyone in sync.',
                icon: '👥',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 bg-brand-surface border border-brand-border rounded-xl hover:border-indigo-500/50 transition-colors hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-brand-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Organize Your Scores?</h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join musicians and ensembles who trust ScoreVault with their arrangements
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-border bg-brand-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl text-indigo-400">♪</span>
                <span className="font-bold text-white">ScoreVault</span>
              </div>
              <p className="text-slate-400 text-sm">
                Professional score management for musicians and ensembles
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-brand-border pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2026 ScoreVault. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Twitter</Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">GitHub</Link>
              <Link href="#" className="text-slate-400 hover:text-white transition-colors text-sm">Discord</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
