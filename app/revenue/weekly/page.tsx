'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import KPICard from '@/components/KPICard';
import WeeklyRevenueChart from '@/components/WeeklyRevenueChart';
import FilterBar from '@/components/FilterBar';
import { buildWeeklyRevenue, applyFilters, getUniqueClientNames } from '@/lib/processing';
import { formatCurrency, formatCurrencyFull, DEFAULT_FILTERS, type DashboardFilters } from '@/lib/utils';

export default function WeeklyRevenuePage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  return (
    <PageShell
      title="Weekly Revenue"
      subtitle="Revenue performance by week"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const clientNames = getUniqueClientNames(data.revenue);
        const filtered = applyFilters(data, filters);
        const isFiltered = filters.datePreset !== 'all_time' || filters.clientName !== null;
        const weeklyData = buildWeeklyRevenue(filtered.revenue, filtered.revenueLines, isFiltered);

        // Stats
        const totalWeeklyRev = weeklyData.reduce((s, w) => s + w.total, 0);
        const avgWeekly = weeklyData.length > 0 ? totalWeeklyRev / weeklyData.length : 0;
        const maxWeek = weeklyData.length > 0 ? weeklyData.reduce((a, b) => (a.total > b.total ? a : b)) : null;
        const minWeek = weeklyData.length > 0 ? weeklyData.reduce((a, b) => (a.total < b.total ? a : b)) : null;

        return (
          <>
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              clientNames={clientNames}
              lastRefreshed={lastRefreshed}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <KPICard
                title="Total Revenue"
                value={formatCurrency(totalWeeklyRev)}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
                subtitle={`across ${weeklyData.length} weeks`}
                delay="delay-100"
              />
              <KPICard
                title="Avg Weekly Revenue"
                value={formatCurrency(avgWeekly)}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                gradient="linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)"
                subtitle="per week average"
                delay="delay-200"
              />
              <KPICard
                title="Best Week"
                value={maxWeek ? formatCurrency(maxWeek.total) : 'N/A'}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                gradient="linear-gradient(135deg, #01B574 0%, #38D9A9 100%)"
                subtitle={maxWeek ? `Week of ${maxWeek.week}` : ''}
                delay="delay-300"
              />
              <KPICard
                title="Lowest Week"
                value={minWeek ? formatCurrency(minWeek.total) : 'N/A'}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                gradient="linear-gradient(135deg, #FFB547 0%, #F6AD55 100%)"
                subtitle={minWeek ? `Week of ${minWeek.week}` : ''}
                delay="delay-400"
              />
            </div>

            {/* Full-width Weekly Chart */}
            <div className="animate-fade-in-up opacity-0 delay-300">
              <WeeklyRevenueChart data={weeklyData} subtitle={isFiltered ? 'Filtered period' : 'Last 9 weeks'} />
            </div>

            {/* Weekly Breakdown Table */}
            <div className="animate-fade-in-up opacity-0 delay-400 mt-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                <h3 className="text-sm font-bold text-navy mb-4">Weekly Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Week Starting</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">vs Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.map((row) => {
                        const diff = avgWeekly > 0 ? ((row.total - avgWeekly) / avgWeekly) * 100 : 0;
                        return (
                          <tr key={row.week} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 text-xs font-medium text-navy">{row.week}</td>
                            <td className="py-3 text-xs text-right font-semibold text-gray-700">{formatCurrencyFull(row.total)}</td>
                            <td className={`py-3 text-xs text-right font-medium ${diff >= 0 ? 'text-success' : 'text-accent-red'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
