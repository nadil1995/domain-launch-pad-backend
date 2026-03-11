'use client';

import { ReactNode } from 'react';
import AppNav from './AppNav';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function AppLayout({ title, subtitle, action, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <AppNav />

      {/* Page Header */}
      <div className="border-b border-brand-border bg-brand-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-slate-400 mt-2">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
