'use client';

import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: ReactNode;
  gradient: string;
  delay?: string;
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  gradient,
  delay = '',
}: KPICardProps) {
  return (
    <div
      className={`card-hover animate-fade-in-up opacity-0 ${delay} bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-navy truncate">{value}</h3>
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-semibold ${
                  trend.isPositive ? 'text-success' : 'text-accent-red'
                }`}
              >
                {trend.isPositive ? (
                  <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {trend.value}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-gray-400">{subtitle}</span>
            )}
          </div>
        </div>
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
          style={{ background: gradient }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for KPI cards
export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-3 w-20 rounded animate-shimmer" />
          <div className="mt-2 h-7 w-28 rounded animate-shimmer" />
          <div className="mt-2 h-3 w-24 rounded animate-shimmer" />
        </div>
        <div className="w-14 h-14 rounded-2xl animate-shimmer" />
      </div>
    </div>
  );
}
