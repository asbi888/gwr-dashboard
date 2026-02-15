'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import KPICard from '@/components/KPICard';
import ExpenseDetailTable from '@/components/ExpenseDetailTable';
import FilterBar from '@/components/FilterBar';
import { applyFilters, getUniqueClientNames, computeKPIs } from '@/lib/processing';
import { formatCurrency, formatPercent, DEFAULT_FILTERS, type DashboardFilters } from '@/lib/utils';

export default function AllTransactionsPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  return (
    <PageShell
      title="All Transactions"
      subtitle="Complete expense transaction history"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const clientNames = getUniqueClientNames(data.revenue);
        const filtered = applyFilters(data, filters);
        const kpis = computeKPIs(filtered);

        // Expense stats
        const totalExpenses = filtered.expenses.reduce((s, e) => s + e.total_amount, 0);
        const totalVat = filtered.expenses.reduce((s, e) => s + e.vat_amount, 0);
        const totalNet = filtered.expenses.reduce((s, e) => s + e.net_amount, 0);
        const avgPerTxn = filtered.expenses.length > 0 ? totalExpenses / filtered.expenses.length : 0;

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
                title="Total Expenses"
                value={formatCurrency(totalExpenses)}
                trend={{ value: formatPercent(kpis.expTrend), isPositive: kpis.expTrend <= 0 }}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
                gradient="linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)"
                subtitle="vs last month"
                delay="delay-100"
              />
              <KPICard
                title="Transactions"
                value={filtered.expenses.length.toString()}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
                subtitle="total count"
                delay="delay-200"
              />
              <KPICard
                title="Net Amount"
                value={formatCurrency(totalNet)}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                gradient="linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)"
                subtitle={`VAT: ${formatCurrency(totalVat)}`}
                delay="delay-300"
              />
              <KPICard
                title="Avg per Transaction"
                value={formatCurrency(avgPerTxn)}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
                gradient="linear-gradient(135deg, #FFB547 0%, #F6AD55 100%)"
                subtitle="average amount"
                delay="delay-400"
              />
            </div>

            {/* Full Expense Table */}
            <div className="animate-fade-in-up opacity-0 delay-300">
              <ExpenseDetailTable expenses={filtered.expenses} suppliers={data.suppliers} />
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
