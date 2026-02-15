'use client';

import { type ReactNode } from 'react';
import { useDashboardData } from '@/lib/data-context';
import { KPICardSkeleton } from './KPICard';

interface PageShellProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: (data: NonNullable<ReturnType<typeof useDashboardData>['data']>, lastRefreshed: Date | null) => ReactNode;
}

export default function PageShell({ title, subtitle, icon, children }: PageShellProps) {
  const { data, loading, error, lastRefreshed, refresh } = useDashboardData();

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-navy mb-1">Failed to load data</h2>
        <p className="text-sm text-gray-400 max-w-sm mb-4">{error}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading || !data) {
    return (
      <div className="page-transition">
        <div className="mb-6">
          <div className="h-7 w-48 rounded animate-shimmer mb-1" />
          <div className="h-4 w-72 rounded animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {[...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl h-72 animate-shimmer" />
          <div className="bg-white rounded-2xl h-72 animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      {/* Page Header */}
      <div className="mb-6 animate-fade-in-up opacity-0">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
            >
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-navy">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Page Content */}
      {children(data, lastRefreshed)}
    </div>
  );
}
