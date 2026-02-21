'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onMenuToggle: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview',
  '/revenue/trend': 'Revenue Trend',
  '/revenue/weekly': 'Weekly Revenue',
  '/revenue/clients': 'Revenue by Client',
  '/revenue/menu': 'Menu Performance',
  '/expenses/suppliers': 'Expenses by Supplier',
  '/expenses/transactions': 'All Transactions',
  '/operations/inventory': 'Operations - Inventory',
  '/operations/data-entry': 'Data Entry',
  '/admin/users': 'User Management',
};

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard';
  const { profile, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = profile?.full_name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'GW';

  const roleName = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : '';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left side: Hamburger (mobile) + Page title */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Mobile logo (only visible on mobile since sidebar has it on desktop) */}
            <div className="lg:hidden flex items-center gap-2">
              <Image
                src="/gwr-logo.png"
                alt="GWaveRunner"
                width={32}
                height={32}
                className="rounded-lg object-contain"
              />
              <span className="text-sm font-bold text-navy">GWR</span>
            </div>

            {/* Breadcrumb-style title on desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-gray-400">Pages</span>
              <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-xs font-semibold text-navy">{pageTitle}</span>
            </div>
          </div>

          {/* Right side: Search + Notifications + Profile */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className={`relative transition-all duration-300 ${searchOpen ? 'w-56' : 'w-9'}`}>
              {searchOpen ? (
                <div className="flex items-center bg-gray-50 rounded-xl px-3 h-9">
                  <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-xs ml-2 w-full text-gray-700 placeholder-gray-400"
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Notifications */}
            <button className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-white text-[11px] font-bold cursor-pointer transition-shadow hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
              >
                {initials}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl shadow-gray-200/60 border border-gray-100 py-2 z-50">
                  {/* User info */}
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-navy truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{profile?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary">
                      {roleName}
                    </span>
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
