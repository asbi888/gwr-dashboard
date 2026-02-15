'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  fetchDashboardData,
  type Expense,
  type Supplier,
  type Revenue,
  type RevenueLine,
} from '@/lib/supabase';
import {
  formatCurrency,
  formatPercent,
  percentChange,
  resolvePresetToRange,
  type DashboardFilters,
  DEFAULT_FILTERS,
} from '@/lib/utils';
import KPICard, { KPICardSkeleton } from './KPICard';
import RevenueExpenseChart, { RevenueExpenseChartSkeleton } from './RevenueExpenseChart';
import WeeklyRevenueChart, { WeeklyRevenueChartSkeleton } from './WeeklyRevenueChart';
import TopClientsTable, { TopClientsTableSkeleton } from './TopClientsTable';
import TopSuppliersTable, { TopSuppliersTableSkeleton } from './TopSuppliersTable';
import MenuPieChart, { MenuPieChartSkeleton } from './MenuPieChart';
import FilterBar from './FilterBar';
import ExpenseDetailTable from './ExpenseDetailTable';
import ClientRevenueTable from './ClientRevenueTable';

interface DashboardData {
  expenses: Expense[];
  suppliers: Supplier[];
  revenue: Revenue[];
  revenueLines: RevenueLine[];
}

// ── Filter application ──

function applyFilters(data: DashboardData, filters: DashboardFilters): DashboardData {
  const resolved = resolvePresetToRange(filters.datePreset, filters.dateRange);

  let filteredRevenue = data.revenue;
  let filteredExpenses = data.expenses;

  // Date filter
  if (resolved.from) {
    filteredRevenue = filteredRevenue.filter((r) => r.revenue_date >= resolved.from!);
    filteredExpenses = filteredExpenses.filter((e) => e.expense_date >= resolved.from!);
  }
  if (resolved.to) {
    filteredRevenue = filteredRevenue.filter((r) => r.revenue_date <= resolved.to!);
    filteredExpenses = filteredExpenses.filter((e) => e.expense_date <= resolved.to!);
  }

  // Client filter (revenue only — expenses have no client field)
  if (filters.clientName) {
    filteredRevenue = filteredRevenue.filter((r) => {
      const normalized = r.client_name.charAt(0).toUpperCase() + r.client_name.slice(1).toLowerCase();
      return normalized === filters.clientName;
    });
  }

  // Filter revenue lines to matching orders
  const matchingIds = new Set(filteredRevenue.map((r) => r.revenue_id));
  const filteredLines = data.revenueLines.filter((l) => matchingIds.has(l.revenue_id));

  return {
    expenses: filteredExpenses,
    suppliers: data.suppliers,
    revenue: filteredRevenue,
    revenueLines: filteredLines,
  };
}

// ── Data processing helpers ──

function buildMonthlyChart(revenue: Revenue[], revenueLines: RevenueLine[], expenses: Expense[]) {
  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((line) => {
    revenueByOrder[line.revenue_id] = (revenueByOrder[line.revenue_id] || 0) + line.line_total;
  });

  const revByMonth: Record<string, number> = {};
  revenue.forEach((r) => {
    const key = r.revenue_date.substring(0, 7);
    const orderRevenue = revenueByOrder[r.revenue_id] || r.total_revenue;
    revByMonth[key] = (revByMonth[key] || 0) + orderRevenue;
  });

  const expByMonth: Record<string, number> = {};
  expenses.forEach((e) => {
    const key = e.expense_date.substring(0, 7);
    expByMonth[key] = (expByMonth[key] || 0) + e.total_amount;
  });

  const allMonths = [...new Set([...Object.keys(revByMonth), ...Object.keys(expByMonth)])].sort();

  return allMonths.map((m) => ({
    month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: revByMonth[m] || 0,
    expenses: expByMonth[m] || 0,
  }));
}

function buildWeeklyRevenue(revenue: Revenue[], revenueLines: RevenueLine[], useAllData = false) {
  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((line) => {
    revenueByOrder[line.revenue_id] = (revenueByOrder[line.revenue_id] || 0) + line.line_total;
  });

  let startDate: Date;
  if (useAllData && revenue.length > 0) {
    const dates = revenue.map((r) => new Date(r.revenue_date).getTime());
    startDate = new Date(Math.min(...dates));
  } else {
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    startDate = new Date(now.getTime() - 9 * msPerWeek);
  }

  const grouped: Record<string, number> = {};
  revenue.forEach((r) => {
    const date = new Date(r.revenue_date);
    if (date >= startDate) {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      const orderRevenue = revenueByOrder[r.revenue_id] || r.total_revenue;
      grouped[key] = (grouped[key] || 0) + orderRevenue;
    }
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, total]) => ({
      week: new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
    }));
}

function buildTopClients(revenue: Revenue[], revenueLines: RevenueLine[]) {
  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((line) => {
    revenueByOrder[line.revenue_id] = (revenueByOrder[line.revenue_id] || 0) + line.line_total;
  });

  const clientMap: Record<string, { orders: number; revenue: number }> = {};
  revenue.forEach((r) => {
    const name = r.client_name.charAt(0).toUpperCase() + r.client_name.slice(1).toLowerCase();
    if (!clientMap[name]) clientMap[name] = { orders: 0, revenue: 0 };
    clientMap[name].orders += 1;
    clientMap[name].revenue += revenueByOrder[r.revenue_id] || r.total_revenue;
  });

  return Object.entries(clientMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function buildTopSuppliers(expenses: Expense[], suppliers: Supplier[]) {
  const supplierMap: Record<number, { total: number }> = {};
  expenses.forEach((e) => {
    if (!supplierMap[e.supplier_key]) supplierMap[e.supplier_key] = { total: 0 };
    supplierMap[e.supplier_key].total += e.total_amount;
  });

  const supplierLookup: Record<number, Supplier> = {};
  suppliers.forEach((s) => {
    supplierLookup[s.supplier_key] = s;
  });

  return Object.entries(supplierMap)
    .map(([key, data]) => {
      const sup = supplierLookup[Number(key)];
      return {
        name: sup?.standard_name || `Supplier ${key}`,
        category: sup?.category || 'General',
        total: data.total,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function buildMenuPerformance(revenueLines: RevenueLine[]) {
  const menuMap: Record<string, { value: number; quantity: number }> = {};
  revenueLines.forEach((line) => {
    if (!menuMap[line.menu_item]) menuMap[line.menu_item] = { value: 0, quantity: 0 };
    menuMap[line.menu_item].value += line.line_total;
    menuMap[line.menu_item].quantity += line.quantity;
  });

  return Object.entries(menuMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value);
}

function computeKPIs(data: DashboardData) {
  const { expenses, revenue, revenueLines } = data;

  const totalRevenue = revenueLines.reduce((sum, l) => sum + l.line_total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0);
  const profitLoss = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;
  const totalOrders = revenue.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((l) => {
    revenueByOrder[l.revenue_id] = (revenueByOrder[l.revenue_id] || 0) + l.line_total;
  });

  let curMonthRev = 0, prevMonthRev = 0;
  let curMonthExp = 0, prevMonthExp = 0;
  let curMonthOrders = 0, prevMonthOrders = 0;

  revenue.forEach((r) => {
    const m = r.revenue_date.substring(0, 7);
    const rev = revenueByOrder[r.revenue_id] || r.total_revenue;
    if (m === currentMonth) { curMonthRev += rev; curMonthOrders++; }
    if (m === prevMonthKey) { prevMonthRev += rev; prevMonthOrders++; }
  });

  expenses.forEach((e) => {
    const m = e.expense_date.substring(0, 7);
    if (m === currentMonth) curMonthExp += e.total_amount;
    if (m === prevMonthKey) prevMonthExp += e.total_amount;
  });

  return {
    totalRevenue,
    totalExpenses,
    profitLoss,
    profitMargin,
    totalOrders,
    avgOrderValue,
    revTrend: percentChange(curMonthRev, prevMonthRev),
    expTrend: percentChange(curMonthExp, prevMonthExp),
    orderTrend: percentChange(curMonthOrders, prevMonthOrders),
  };
}

// ── Icons ──

function RevenueIcon() {
  return (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
  );
}

function ProfitIcon() {
  return (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

// ── Main Dashboard Component ──

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Data fetching with auto-refresh
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const result = await fetchDashboardData();
      setData(result);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: unknown) {
      if (isInitial) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Auto-refresh every 30 seconds (silent)
  useEffect(() => {
    const interval = setInterval(() => loadData(false), 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Derived: unique client names (from full dataset, not filtered)
  const clientNames = useMemo(() => {
    if (!data) return [];
    const names = new Set<string>();
    data.revenue.forEach((r) => {
      const name = r.client_name.charAt(0).toUpperCase() + r.client_name.slice(1).toLowerCase();
      names.add(name);
    });
    return Array.from(names).sort();
  }, [data]);

  // Derived: filtered data
  const filtered = useMemo(() => {
    if (!data) return null;
    return applyFilters(data, filters);
  }, [data, filters]);

  // Derived: processed data for charts/tables
  const isFiltered = filters.datePreset !== 'all_time' || filters.clientName !== null;
  const processed = useMemo(() => {
    if (!filtered) return null;
    return {
      kpis: computeKPIs(filtered),
      monthlyChart: buildMonthlyChart(filtered.revenue, filtered.revenueLines, filtered.expenses),
      weeklyData: buildWeeklyRevenue(filtered.revenue, filtered.revenueLines, isFiltered),
      topClients: buildTopClients(filtered.revenue, filtered.revenueLines),
      topSuppliers: buildTopSuppliers(filtered.expenses, filtered.suppliers),
      menuData: buildMenuPerformance(filtered.revenueLines),
    };
  }, [filtered, isFiltered]);

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-navy mb-1">Failed to load data</h2>
        <p className="text-sm text-gray-400 max-w-sm">{error}</p>
        <button
          onClick={() => loadData(true)}
          className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Loading state ──
  if (loading || !data) {
    return (
      <>
        <div className="mb-6">
          <div className="h-7 w-48 rounded animate-shimmer mb-1" />
          <div className="h-4 w-72 rounded animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {[...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <RevenueExpenseChartSkeleton />
          <WeeklyRevenueChartSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <TopClientsTableSkeleton />
          <TopSuppliersTableSkeleton />
          <MenuPieChartSkeleton />
        </div>
      </>
    );
  }

  if (!processed || !filtered) return null;

  const { kpis, monthlyChart, weeklyData, topClients, topSuppliers, menuData } = processed;
  const trendSubtitle = isFiltered ? 'in selected period' : 'vs last month';

  return (
    <>
      {/* Header */}
      <div className="mb-4 animate-fade-in-up opacity-0">
        <h2 className="text-2xl font-bold text-navy">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          GWaveRunner Marine Catering &middot; Mauritius
        </p>
      </div>

      {/* Filter Bar */}
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
          value={formatCurrency(kpis.totalRevenue)}
          trend={{
            value: formatPercent(kpis.revTrend),
            isPositive: kpis.revTrend >= 0,
          }}
          subtitle={trendSubtitle}
          icon={<RevenueIcon />}
          gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
          delay="delay-100"
        />
        <KPICard
          title="Total Expenses"
          value={formatCurrency(kpis.totalExpenses)}
          trend={{
            value: formatPercent(kpis.expTrend),
            isPositive: kpis.expTrend <= 0,
          }}
          subtitle={trendSubtitle}
          icon={<ExpenseIcon />}
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          delay="delay-200"
        />
        <KPICard
          title="Profit / Loss"
          value={formatCurrency(kpis.profitLoss)}
          trend={{
            value: `${kpis.profitMargin.toFixed(1)}% margin`,
            isPositive: kpis.profitLoss >= 0,
          }}
          icon={<ProfitIcon />}
          gradient={
            kpis.profitLoss >= 0
              ? 'linear-gradient(135deg, #01B574 0%, #38D9A9 100%)'
              : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)'
          }
          delay="delay-300"
        />
        <KPICard
          title="Total Orders"
          value={kpis.totalOrders.toLocaleString()}
          trend={{
            value: formatPercent(kpis.orderTrend),
            isPositive: kpis.orderTrend >= 0,
          }}
          subtitle={`Avg ${formatCurrency(kpis.avgOrderValue)}`}
          icon={<OrdersIcon />}
          gradient="linear-gradient(135deg, #4FD1C5 0%, #81E6D9 100%)"
          delay="delay-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <RevenueExpenseChart data={monthlyChart} />
        <WeeklyRevenueChart
          data={weeklyData}
          subtitle={isFiltered ? 'For selected period' : undefined}
        />
      </div>

      {/* Bottom Row - Aggregated views */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <TopClientsTable data={topClients} />
        <TopSuppliersTable data={topSuppliers} />
        <MenuPieChart data={menuData} />
      </div>

      {/* Client Revenue Detail (visible when client filter active) */}
      {filters.clientName && (
        <ClientRevenueTable
          clientName={filters.clientName}
          revenue={filtered.revenue}
          revenueLines={filtered.revenueLines}
        />
      )}

      {/* Expense Detail Table */}
      <ExpenseDetailTable
        expenses={filtered.expenses}
        suppliers={filtered.suppliers}
      />
    </>
  );
}
