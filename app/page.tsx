'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import KPICard from '@/components/KPICard';
import RevenueExpenseChart from '@/components/RevenueExpenseChart';
import FilterBar from '@/components/FilterBar';
import { computeKPIs, buildMonthlyChart, buildTopClients, buildTopSuppliers, applyFilters, getUniqueClientNames, computeInventory } from '@/lib/processing';
import { formatCurrency, formatPercent, formatCurrencyFull, DEFAULT_FILTERS, type DashboardFilters } from '@/lib/utils';

const QUICK_LINKS = [
  {
    href: '/revenue/trend',
    label: 'Revenue Trend',
    desc: 'Monthly revenue vs expenses',
    gradient: 'linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    href: '/revenue/clients',
    label: 'By Client',
    desc: 'Client orders & line items',
    gradient: 'linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/expenses/suppliers',
    label: 'By Supplier',
    desc: 'Supplier expense breakdown',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  {
    href: '/revenue/menu',
    label: 'Menu Items',
    desc: 'Menu performance analysis',
    gradient: 'linear-gradient(135deg, #FFB547 0%, #F6AD55 100%)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      </svg>
    ),
  },
  {
    href: '/operations/inventory',
    label: 'Inventory',
    desc: 'Food & beverage stock levels',
    gradient: 'linear-gradient(135deg, #01B574 0%, #38D9A9 100%)',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

export default function OverviewPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);

  return (
    <PageShell
      title="Overview"
      subtitle="GWaveRunner Marine Catering at a glance"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const clientNames = getUniqueClientNames(data.revenue);
        const filtered = applyFilters(data, filters);
        const kpis = computeKPIs(filtered);
        const monthlyChart = buildMonthlyChart(filtered.revenue, filtered.revenueLines, filtered.expenses, data.wrRevenue);
        const topClients = buildTopClients(filtered.revenue, filtered.revenueLines, 3);
        const topSuppliers = buildTopSuppliers(filtered.expenses, data.suppliers, 3);
        const inventory = computeInventory(data.expenses, data.foodUsage);
        const criticalItems = inventory.filter((i) => i.status === 'red');

        return (
          <>
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              clientNames={clientNames}
              lastRefreshed={lastRefreshed}
            />

            {/* Inventory Alert Banner */}
            {criticalItems.length > 0 && (
              <div className="animate-fade-in-up opacity-0 delay-100 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-xs font-bold text-accent-red">Inventory Alert</h3>
                  </div>
                  {criticalItems.map((item) => (
                    <p key={item.productKey} className="text-xs text-red-600 ml-6">
                      {item.product}: {item.onHand.toFixed(1)} kg on hand ({item.daysSupply} days supply)
                    </p>
                  ))}
                  <Link href="/operations/inventory" className="text-xs text-primary font-medium mt-2 ml-6 inline-block hover:underline">
                    View full inventory details →
                  </Link>
                </div>
              </div>
            )}

            {/* KPI Cards */}
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
                title="Profit / Loss"
                value={formatCurrency(kpis.profitLoss)}
                trend={{ value: `${kpis.profitMargin.toFixed(1)}% margin`, isPositive: kpis.profitLoss >= 0 }}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                gradient={kpis.profitLoss >= 0 ? 'linear-gradient(135deg, #01B574 0%, #38D9A9 100%)' : 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)'}
                subtitle="net margin"
                delay="delay-300"
              />
              <KPICard
                title="Total Orders"
                value={kpis.totalOrders.toString()}
                trend={{ value: formatPercent(kpis.orderTrend), isPositive: kpis.orderTrend >= 0 }}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                gradient="linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)"
                subtitle={`Avg ${formatCurrency(kpis.avgOrderValue)}/order`}
                delay="delay-400"
              />
            </div>

            {/* Revenue Chart */}
            <div className="animate-fade-in-up opacity-0 delay-300 mb-6">
              <RevenueExpenseChart data={monthlyChart} />
            </div>

            {/* Quick Links */}
            <div className="animate-fade-in-up opacity-0 delay-400">
              <h3 className="text-sm font-bold text-navy mb-3">Quick Access</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_LINKS.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="card-hover bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 group cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-xl"
                          style={{ background: link.gradient }}
                        >
                          {link.icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy group-hover:text-primary transition-colors">
                            {link.label}
                          </p>
                          <p className="text-[10px] text-gray-400">{link.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View details
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Clients & Top Suppliers Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6 animate-fade-in-up opacity-0 delay-500">
              {/* Top Clients Mini */}
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-navy">Top Clients</h3>
                  <Link href="/revenue/clients" className="text-[10px] text-primary font-medium hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {topClients.map((client, i) => (
                    <div key={client.name} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{client.name}</p>
                        <p className="text-[10px] text-gray-400">{client.orders} orders</p>
                      </div>
                      <span className="text-xs font-bold text-navy">{formatCurrency(client.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Suppliers Mini */}
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-navy">Top Suppliers</h3>
                  <Link href="/expenses/suppliers" className="text-[10px] text-primary font-medium hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {topSuppliers.map((supplier, i) => (
                    <div key={supplier.name} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-navy truncate">{supplier.name}</p>
                        <p className="text-[10px] text-gray-400">{supplier.category}</p>
                      </div>
                      <span className="text-xs font-bold text-accent-red">{formatCurrency(supplier.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
