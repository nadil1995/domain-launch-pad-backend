'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity mb-6">
              <span className="text-3xl text-indigo-400">♪</span>
              <span className="text-2xl font-bold text-white">ScoreVault</span>
            </Link>
            <h2 className="text-xl font-semibold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="conductor@example.com"
                className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-brand-border text-center">
            <p className="text-xs text-slate-400 mb-3">Demo credentials:</p>
            <div className="bg-brand-card border border-brand-border rounded-lg p-3">
              <p className="text-xs text-slate-300 font-mono">conductor@example.com</p>
              <p className="text-xs text-slate-300 font-mono">password123</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400 mb-2">Don't have an account?</p>
            <Link href="/register" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create one →
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
