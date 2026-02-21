'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from './auth-context';
import { logActivity } from './activity';

/**
 * Tracks user activity: page views on route changes.
 * Login tracking is handled in auth-context.tsx signIn().
 * Call once in AppShell.
 */
export function useActivityTracker() {
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !profile || !pathname) return;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    if (pathname !== '/admin/activity') {
      logActivity(profile.id, 'page_view', pathname);
    }
  }, [pathname, loading, profile]);
}
