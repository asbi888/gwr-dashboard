'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import KPICard from '@/components/KPICard';
import RevenueExpenseChart from '@/components/RevenueExpenseChart';
import FilterBar from '@/components/FilterBar';
import { computeKPIs, buildMonthlyChart, applyFilters, getUniqueClientNames } from '@/lib/processing';
import { formatCurrency, formatPercent, formatCurrencyFull, DEFAULT_FILTERS, type DashboardFilters } from '@/lib/utils';

export default function RevenueTrendPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  return (
    <PageShell
      title="Revenue Trend"
      subtitle="Monthly revenue vs expenses over time"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const clientNames = getUniqueClientNames(data.revenue);
        const filtered = applyFilters(data, filters);
        const kpis = computeKPIs(filtered);
        const monthlyChart = buildMonthlyChart(filtered.revenue, filtered.revenueLines, filtered.expenses);

        // Monthly averages
        const months = monthlyChart.length || 1;
        const avgMonthlyRev = kpis.totalRevenue / months;
        const avgMonthlyExp = kpis.totalExpenses / months;

        return (
          <>
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              clientNames={clientNames}
              lastRefreshed={lastRefreshed}
            />

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <KPICard
                title="Total Revenue"
                value={formatCurrency(kpis.totalRevenue)}
                trend={{ value: formatPercent(kpis.revTrend), isPositive: kpis.revTrend >= 0 }}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
                subtitle="vs last month"
                delay="delay-100"
              />
              <KPICard
                title="Total Expenses"
                value={formatCurrency(kpis.totalExpenses)}
                trend={{ value: formatPercent(kpis.expTrend), isPositive: kpis.expTrend <= 0 }}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
                gradient="linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)"
                subtitle="vs last month"
                delay="delay-200"
              />
              <KPICard
                title="Avg Monthly Revenue"
                value={formatCurrency(avgMonthlyRev)}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                gradient="linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)"
                subtitle={`over ${months} months`}
                delay="delay-300"
              />
              <KPICard
                title="Profit / Loss"
                value={formatCurrency(kpis.profitLoss)}
                trend={{ value: `${kpis.profitMargin.toFixed(1)}% margin`, isPositive: kpis.profitLoss >= 0 }}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                gradient={kpis.profitLoss >= 0 ? 'linear-gradient(135deg, #01B574 0%, #38D9A9 100%)' : 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)'}
                subtitle="net margin"
                delay="delay-400"
              />
            </div>

            {/* Full-width Chart */}
            <div className="animate-fade-in-up opacity-0 delay-300">
              <RevenueExpenseChart data={monthlyChart} />
            </div>

            {/* Monthly Breakdown Table */}
            <div className="animate-fade-in-up opacity-0 delay-400 mt-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                <h3 className="text-sm font-bold text-navy mb-4">Monthly Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Month</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Expenses</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Profit</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyChart.map((row) => {
                        const profit = row.revenue - row.expenses;
                        const margin = row.revenue > 0 ? (profit / row.revenue) * 100 : 0;
                        return (
                          <tr key={row.month} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 text-xs font-medium text-navy">{row.month}</td>
                            <td className="py-3 text-xs text-right text-gray-600">{formatCurrencyFull(row.revenue)}</td>
                            <td className="py-3 text-xs text-right text-gray-600">{formatCurrencyFull(row.expenses)}</td>
                            <td className={`py-3 text-xs font-semibold text-right ${profit >= 0 ? 'text-success' : 'text-accent-red'}`}>
                              {formatCurrencyFull(profit)}
                            </td>
                            <td className={`py-3 text-xs text-right ${margin >= 0 ? 'text-success' : 'text-accent-red'}`}>
                              {margin.toFixed(1)}%
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
