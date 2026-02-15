'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import MenuPieChart from '@/components/MenuPieChart';
import FilterBar from '@/components/FilterBar';
import { buildMenuPerformance, applyFilters, getUniqueClientNames } from '@/lib/processing';
import { formatCurrency, formatCurrencyFull, DEFAULT_FILTERS, type DashboardFilters } from '@/lib/utils';

export default function MenuPerformancePage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  return (
    <PageShell
      title="Menu Performance"
      subtitle="Revenue breakdown by menu item"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const clientNames = getUniqueClientNames(data.revenue);
        const filtered = applyFilters(data, filters);
        const menuData = buildMenuPerformance(filtered.revenueLines);

        const totalValue = menuData.reduce((s, m) => s + m.value, 0);
        const totalQty = menuData.reduce((s, m) => s + m.quantity, 0);

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
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Menu Items</p>
                <p className="text-2xl font-bold text-navy">{menuData.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">unique items sold</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-200">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">from all menu items</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 animate-fade-in-up opacity-0 delay-300">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Quantity</p>
                <p className="text-2xl font-bold text-secondary">{totalQty.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-0.5">items served</p>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="animate-fade-in-up opacity-0 delay-300 mb-6">
              <MenuPieChart data={menuData.slice(0, 8)} />
            </div>

            {/* Full Menu Breakdown Table */}
            <div className="animate-fade-in-up opacity-0 delay-400">
              <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                <h3 className="text-sm font-bold text-navy mb-4">Full Menu Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                        <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Menu Item</th>
                        <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Quantity</th>
                        <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                        <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Avg Price</th>
                        <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuData.map((item, i) => {
                        const share = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                        const avgPrice = item.quantity > 0 ? item.value / item.quantity : 0;
                        return (
                          <tr key={item.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 pr-3 text-xs text-gray-400">{i + 1}</td>
                            <td className="py-3 pr-3 text-xs font-semibold text-navy">{item.name}</td>
                            <td className="py-3 pr-3 text-xs text-right text-gray-600">{item.quantity.toLocaleString()}</td>
                            <td className="py-3 pr-3 text-xs text-right font-semibold text-navy">{formatCurrencyFull(item.value)}</td>
                            <td className="py-3 pr-3 text-xs text-right text-gray-600">{formatCurrencyFull(avgPrice)}</td>
                            <td className="py-3 text-xs text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.min(share, 100)}%`,
                                      background: 'linear-gradient(90deg, #7B61FF, #4FD1C5)',
                                    }}
                                  />
                                </div>
                                <span className="text-gray-500 w-10 text-right">{share.toFixed(1)}%</span>
                              </div>
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
