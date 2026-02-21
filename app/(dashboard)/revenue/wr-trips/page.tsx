'use client';

import { useState, useMemo } from 'react';
import PageShell from '@/components/PageShell';
import FilterBar from '@/components/FilterBar';
import {
  formatCurrency,
  formatCurrencyFull,
  formatDate,
  DEFAULT_FILTERS,
  normalizeClientName,
  resolvePresetToRange,
  type DashboardFilters,
} from '@/lib/utils';
import type { WRRevenue } from '@/lib/supabase';

function filterWRRevenue(wrRevenue: WRRevenue[], filters: DashboardFilters): WRRevenue[] {
  const resolved = resolvePresetToRange(filters.datePreset, filters.dateRange);
  let filtered = wrRevenue;

  if (resolved.from) {
    filtered = filtered.filter((r) => r.revenue_date >= resolved.from!);
  }
  if (resolved.to) {
    filtered = filtered.filter((r) => r.revenue_date <= resolved.to!);
  }
  if (filters.clientName) {
    filtered = filtered.filter(
      (r) => normalizeClientName(r.client_name) === filters.clientName
    );
  }

  return filtered;
}

function getWRClientNames(wrRevenue: WRRevenue[]): string[] {
  const names = new Set<string>();
  wrRevenue.forEach((r) => names.add(normalizeClientName(r.client_name)));
  return Array.from(names).sort();
}

interface TopWRClient {
  name: string;
  trips: number;
  revenue: number;
}

function buildTopWRClients(wrRevenue: WRRevenue[], limit = 20): TopWRClient[] {
  const clientMap: Record<string, { trips: number; revenue: number }> = {};
  wrRevenue.forEach((r) => {
    const name = normalizeClientName(r.client_name);
    if (!clientMap[name]) clientMap[name] = { trips: 0, revenue: 0 };
    clientMap[name].trips += 1;
    clientMap[name].revenue += r.amount || 0;
  });

  return Object.entries(clientMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export default function WRTripsPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  return (
    <PageShell
      title="WR Revenue"
      subtitle="Boat trips & excursion revenue"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const clientNames = getWRClientNames(data.wrRevenue);
        const filtered = filterWRRevenue(data.wrRevenue, filters);
        const topClients = buildTopWRClients(filtered);

        const totalRevenue = filtered.reduce((s, r) => s + (r.amount || 0), 0);
        const totalTrips = filtered.length;
        const uniqueClients = new Set(filtered.map((r) => normalizeClientName(r.client_name))).size;
        const avgPerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;

        // Sort trips by date descending for the table
        const sortedTrips = [...filtered].sort((a, b) => b.revenue_date.localeCompare(a.revenue_date));

        const maxRevenue = Math.max(...topClients.map((d) => d.revenue), 1);

        return (
          <>
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              clientNames={clientNames}
              lastRefreshed={lastRefreshed}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{totalTrips} trips</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-200">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Clients</p>
                <p className="text-2xl font-bold text-navy">{uniqueClients}</p>
                <p className="text-xs text-gray-400 mt-0.5">active in period</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-300">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Avg per Trip</p>
                <p className="text-2xl font-bold text-secondary">{formatCurrency(avgPerTrip)}</p>
                <p className="text-xs text-gray-400 mt-0.5">average amount</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-400">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Top Client</p>
                <p className="text-2xl font-bold text-navy truncate">{topClients[0]?.name || '—'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {topClients[0] ? `${formatCurrencyFull(topClients[0].revenue)} (${topClients[0].trips} trips)` : 'no data'}
                </p>
              </div>
            </div>

            {/* Top Clients */}
            {topClients.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 mb-6 animate-fade-in-up opacity-0 delay-300">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-navy">Top Clients</h3>
                  <p className="text-xs text-gray-400 mt-0.5">By WR trip revenue</p>
                </div>
                <div className="space-y-4">
                  {topClients.map((client, idx) => (
                    <div key={client.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white shrink-0"
                            style={{
                              background:
                                idx === 0
                                  ? 'linear-gradient(135deg, #7B61FF, #9F8FFF)'
                                  : idx === 1
                                  ? 'linear-gradient(135deg, #4FD1C5, #81E6D9)'
                                  : 'linear-gradient(135deg, #A0AEC0, #CBD5E0)',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-navy truncate">{client.name}</p>
                            <p className="text-xs text-gray-400">{client.trips} trips</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-navy shrink-0 ml-2">
                          {formatCurrencyFull(client.revenue)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${(client.revenue / maxRevenue) * 100}%`,
                            background:
                              idx === 0
                                ? 'linear-gradient(90deg, #7B61FF, #9F8FFF)'
                                : idx === 1
                                ? 'linear-gradient(90deg, #4FD1C5, #81E6D9)'
                                : 'linear-gradient(90deg, #A0AEC0, #CBD5E0)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trips Table */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-400">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-navy">All Trips</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {sortedTrips.length} trip{sortedTrips.length !== 1 ? 's' : ''} in period
                </p>
              </div>

              {sortedTrips.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-400">No trips found for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Client</th>
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Description</th>
                        <th className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedTrips.map((trip) => (
                        <tr key={trip.staging_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(trip.revenue_date)}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-navy">{normalizeClientName(trip.client_name)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{trip.trip_description || '—'}</td>
                          <td className="px-6 py-3 text-xs font-bold text-navy text-right">{formatCurrencyFull(trip.amount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td colSpan={3} className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Total</td>
                        <td className="px-6 py-3 text-sm font-bold text-primary text-right">{formatCurrencyFull(totalRevenue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
