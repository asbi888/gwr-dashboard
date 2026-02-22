'use client';

import { useState, useMemo } from 'react';
import type { DashboardData } from '@/lib/data-context';
import { generateBriefing, type BriefingSection } from '@/lib/ai-insights';
import AIBadge from './AIBadge';
import { SparkleIcon } from './icons';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  performance: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  alert: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-8.03 14A1 1 0 003.14 20h17.72a1 1 0 00.87-1.5l-8.03-14a1 1 0 00-1.72 0z" />
    </svg>
  ),
  opportunity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
};

const DOT_COLORS: Record<string, string> = {
  positive: '#01B574',
  negative: '#FF6B6B',
  warning: '#FFB547',
  neutral: '#A0AEC0',
};

export default function AIBriefingCard({ data }: { data: DashboardData }) {
  const [collapsed, setCollapsed] = useState(false);
  const sections = useMemo(() => generateBriefing(data), [data]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="animate-fade-in-up opacity-0 mb-6">
      <div
        className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden"
        style={{ borderLeft: '4px solid transparent', borderImage: 'linear-gradient(to bottom, #7B61FF, #4FD1C5) 1' }}
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors"
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
          >
            <SparkleIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-navy">AI Daily Briefing</span>
              <AIBadge />
            </div>
            <p className="text-[10px] text-gray-400">{dateStr} &middot; Generated just now</p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Body */}
        {!collapsed && (
          <div className="px-5 pb-5 space-y-4">
            {sections.map((section, i) => (
              <div key={i}>
                {i > 0 && <div className="border-t border-gray-100 mb-4" />}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-gray-400">{SECTION_ICONS[section.icon]}</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {section.title}
                  </span>
                </div>
                <div className="space-y-2 pl-6">
                  {section.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span
                        className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: DOT_COLORS[item.type] }}
                      />
                      <p className="text-xs text-gray-600 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-[10px] text-gray-300">Insights generated from your live business data</span>
              <AIBadge label="Powered by AI" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
