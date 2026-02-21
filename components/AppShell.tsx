'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { canAccessRoute, getDefaultRoute } from '@/lib/permissions';
import { useActivityTracker } from '@/lib/use-activity-tracker';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();

  // Track logins + page views (fire-and-forget)
  useActivityTracker();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Role-based redirect
  useEffect(() => {
    if (!loading && profile && !canAccessRoute(profile.role, pathname)) {
      router.replace(getDefaultRoute(profile.role));
    }
  }, [loading, profile, pathname, router]);

  // Show loading while auth is resolving
  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user cannot access this route, show nothing (redirect in progress)
  if (!canAccessRoute(profile.role, pathname)) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:ml-60 min-h-screen flex flex-col">
        <Navbar onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
