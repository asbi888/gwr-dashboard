'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import TopClientsTable from '@/components/TopClientsTable';
import ClientRevenueTable from '@/components/ClientRevenueTable';
import FilterBar from '@/components/FilterBar';
import { buildTopClients, applyFilters, getUniqueClientNames } from '@/lib/processing';
import { formatCurrency, formatCurrencyFull, DEFAULT_FILTERS, type DashboardFilters } from '@/lib/utils';
import { normalizeClientName } from '@/lib/utils';

export default function RevenueClientsPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  return (
    <PageShell
      title="Revenue by Client"
      subtitle="Client analysis with order details"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const clientNames = getUniqueClientNames(data.revenue);
        const filtered = applyFilters(data, filters);
        const topClients = buildTopClients(filtered.revenue, filtered.revenueLines, 20);

        // Summary stats
        const totalRevenue = filtered.revenueLines.reduce((s, l) => s + l.line_total, 0);
        const uniqueClients = new Set(filtered.revenue.map((r) => normalizeClientName(r.client_name))).size;

        return (
          <>
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              clientNames={clientNames}
              lastRefreshed={lastRefreshed}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Clients</p>
                <p className="text-2xl font-bold text-navy">{uniqueClients}</p>
                <p className="text-xs text-gray-400 mt-0.5">active in period</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-200">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{filtered.revenue.length} orders</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-300">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg per Client</p>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(uniqueClients > 0 ? totalRevenue / uniqueClients : 0)}</p>
                <p className="text-xs text-gray-400 mt-0.5">average revenue</p>
              </div>
            </div>

            {/* Top Clients Table */}
            <div className="animate-fade-in-up opacity-0 delay-300">
              <TopClientsTable data={topClients} />
            </div>

            {/* Client Detail Table (shows when a client is selected) */}
            {filters.clientName && (
              <div className="animate-fade-in-up opacity-0 delay-400">
                <ClientRevenueTable
                  clientName={filters.clientName}
                  revenue={filtered.revenue}
                  revenueLines={filtered.revenueLines}
                />
              </div>
            )}

            {/* Hint when no client selected */}
            {!filters.clientName && (
              <div className="animate-fade-in-up opacity-0 delay-400 mt-6">
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 text-center">
                  <svg className="w-8 h-8 text-primary/40 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm font-medium text-navy mb-1">Select a client to see their orders</p>
                  <p className="text-xs text-gray-400">
                    Use the client filter above to drill down into a specific client&apos;s order history and line items
                  </p>
                </div>
              </div>
            )}
          </>
        );
      }}
    </PageShell>
  );
}
