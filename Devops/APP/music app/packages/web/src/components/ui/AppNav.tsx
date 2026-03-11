'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AppNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/library', label: 'Library' },
    { href: '/concerts', label: 'Concerts' },
    { href: '/settings', label: 'Settings' },
  ];

  const isActive = (href: string) => {
    // Match root path and sub-paths
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 bg-brand-surface border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-2xl text-indigo-400">♪</span>
            <span className="text-lg font-bold text-white">ScoreVault</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden sm:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">{user.name}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-slate-300 hover:text-white hover:bg-brand-card rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
