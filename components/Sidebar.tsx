'use client';

import { useState, useEffect, useCallback } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { id: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'revenue',
    label: 'Revenue',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    children: [
      { id: 'revenue-trend', label: 'Trend' },
      { id: 'weekly-revenue', label: 'Weekly' },
      { id: 'top-clients', label: 'By Client' },
      { id: 'menu-performance', label: 'By Menu Item' },
      { id: 'client-revenue', label: 'Client Orders' },
    ],
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
      </svg>
    ),
    children: [
      { id: 'top-suppliers', label: 'By Supplier' },
      { id: 'expense-details', label: 'All Transactions' },
    ],
  },
];

// All scrollable section IDs for intersection tracking
const ALL_SECTION_IDS = [
  'overview',
  'revenue-trend',
  'weekly-revenue',
  'top-clients',
  'menu-performance',
  'client-revenue',
  'expense-details',
  'top-suppliers',
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    revenue: true,
    expenses: true,
  });
  const [activeSection, setActiveSection] = useState('overview');

  // Toggle expand/collapse for parent items
  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Scroll to section
  const scrollTo = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(id);
      }
      // Close mobile sidebar after navigation
      onMobileClose();
    },
    [onMobileClose]
  );

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    ALL_SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Determine if a nav item or its child is active
  const isActive = (id: string) => activeSection === id;
  const hasActiveChild = (item: NavItem) =>
    item.children?.some((c) => activeSection === c.id) ?? false;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-50 flex flex-col transition-transform duration-300 ease-out
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-navy leading-tight truncate">GWaveRunner</h1>
            <p className="text-[10px] text-gray-400 -mt-0.5">Marine Catering</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 sidebar-scroll">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest px-3 mb-3">
            Navigation
          </p>

          {NAV_ITEMS.map((item) => {
            const active = isActive(item.id) || hasActiveChild(item);
            const isExpanded = expanded[item.id] ?? false;
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.id} className="mb-1">
                {/* Parent item */}
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpand(item.id);
                    } else {
                      scrollTo(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                    active && !hasChildren
                      ? 'bg-primary/8 text-primary'
                      : active
                      ? 'text-primary'
                      : 'text-gray-500 hover:text-navy hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`transition-colors duration-200 ${
                      active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasChildren && (
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      } ${active ? 'text-primary' : 'text-gray-300'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {!hasChildren && active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>

                {/* Children */}
                {hasChildren && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 sidebar-children">
                    {item.children!.map((child) => {
                      const childActive = isActive(child.id);
                      return (
                        <button
                          key={child.id}
                          onClick={() => scrollTo(child.id)}
                          className={`w-full flex items-center gap-2.5 pl-5 pr-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 relative ${
                            childActive
                              ? 'text-primary bg-primary/5'
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {/* Left accent line */}
                          <span
                            className={`absolute left-2 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full transition-all duration-200 ${
                              childActive ? 'bg-primary' : 'bg-gray-200'
                            }`}
                          />
                          {child.label}
                          {childActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-[11px] font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
            >
              GW
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-navy truncate">Admin</p>
              <p className="text-[10px] text-gray-400 truncate">gwr@marine.mu</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
