'use client';

import { useState, useRef, useEffect } from 'react';
import type { DashboardFilters, DatePreset } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  clientNames: string[];
  lastRefreshed: Date | null;
}

export default function FilterBar({
  filters,
  onFiltersChange,
  clientNames,
  lastRefreshed,
}: FilterBarProps) {
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [timeAgo, setTimeAgo] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update "Updated Xs ago" every 5 seconds
  useEffect(() => {
    if (!lastRefreshed) return;
    setTimeAgo(formatTimeAgo(lastRefreshed));
    const timer = setInterval(() => setTimeAgo(formatTimeAgo(lastRefreshed)), 5000);
    return () => clearInterval(timer);
  }, [lastRefreshed]);

  const filteredClients = clientNames.filter((name) =>
    name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const hasActiveFilters = filters.datePreset !== 'all_time' || filters.clientName !== null;

  return (
    <div className="animate-fade-in-up opacity-0 delay-100 mb-6">
      <div className="bg-white rounded-2xl px-5 py-4 shadow-lg shadow-gray-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Date Preset Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
              Period
            </span>
            <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-0.5">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      datePreset: preset.value,
                      dateRange:
                        preset.value !== 'custom'
                          ? { from: null, to: null }
                          : filters.dateRange,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    filters.datePreset === preset.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:text-primary hover:bg-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs */}
          {filters.datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateRange.from || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, from: e.target.value || null },
                  })
                }
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={filters.dateRange.to || ''}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, to: e.target.value || null },
                  })
                }
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
              />
            </div>
          )}

          {/* Client Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setClientDropdownOpen(!clientDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 ${
                filters.clientName
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-500 hover:border-primary/30'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {filters.clientName || 'All Clients'}
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${
                  clientDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Panel */}
            {clientDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                style={{ animation: 'dropdownIn 0.15s ease-out' }}
              >
                {/* Search */}
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs text-gray-700 placeholder-gray-400 outline-none focus:ring-1 focus:ring-primary/30"
                    autoFocus
                  />
                </div>

                {/* Options */}
                <div className="max-h-52 overflow-y-auto">
                  <button
                    onClick={() => {
                      onFiltersChange({ ...filters, clientName: null });
                      setClientDropdownOpen(false);
                      setClientSearch('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                      filters.clientName === null
                        ? 'bg-primary/5 text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All Clients
                  </button>
                  {filteredClients.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        onFiltersChange({ ...filters, clientName: name });
                        setClientDropdownOpen(false);
                        setClientSearch('');
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        filters.clientName === name
                          ? 'bg-primary/5 text-primary font-semibold'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="px-3 py-4 text-xs text-gray-400 text-center">No clients found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Clear + Live indicator */}
          <div className="flex items-center gap-3 lg:ml-auto">
            {hasActiveFilters && (
              <button
                onClick={() =>
                  onFiltersChange({
                    datePreset: 'all_time',
                    dateRange: { from: null, to: null },
                    clientName: null,
                  })
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-accent-red hover:bg-red-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
            {lastRefreshed && (
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                Updated {timeAgo}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-gray-400">Live</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
