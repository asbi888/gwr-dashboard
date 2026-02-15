import type { Expense, Supplier, Revenue, RevenueLine } from './supabase';
import type { DashboardData } from './data-context';
import {
  resolvePresetToRange,
  normalizeClientName,
  percentChange,
  type DashboardFilters,
} from './utils';

// ── Filter application ──

export function applyFilters(data: DashboardData, filters: DashboardFilters): DashboardData {
  const resolved = resolvePresetToRange(filters.datePreset, filters.dateRange);

  let filteredRevenue = data.revenue;
  let filteredExpenses = data.expenses;

  if (resolved.from) {
    filteredRevenue = filteredRevenue.filter((r) => r.revenue_date >= resolved.from!);
    filteredExpenses = filteredExpenses.filter((e) => e.expense_date >= resolved.from!);
  }
  if (resolved.to) {
    filteredRevenue = filteredRevenue.filter((r) => r.revenue_date <= resolved.to!);
    filteredExpenses = filteredExpenses.filter((e) => e.expense_date <= resolved.to!);
  }

  if (filters.clientName) {
    filteredRevenue = filteredRevenue.filter(
      (r) => normalizeClientName(r.client_name) === filters.clientName
    );
  }

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

export function buildMonthlyChart(revenue: Revenue[], revenueLines: RevenueLine[], expenses: Expense[]) {
  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((line) => {
    revenueByOrder[line.revenue_id] = (revenueByOrder[line.revenue_id] || 0) + line.line_total;
  });

  const revByMonth: Record<string, number> = {};
  revenue.forEach((r) => {
    const key = r.revenue_date.substring(0, 7);
    revByMonth[key] = (revByMonth[key] || 0) + (revenueByOrder[r.revenue_id] || r.total_revenue);
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

export function buildWeeklyRevenue(revenue: Revenue[], revenueLines: RevenueLine[], useAllData = false) {
  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((line) => {
    revenueByOrder[line.revenue_id] = (revenueByOrder[line.revenue_id] || 0) + line.line_total;
  });

  let startDate: Date;
  if (useAllData && revenue.length > 0) {
    const dates = revenue.map((r) => new Date(r.revenue_date).getTime());
    startDate = new Date(Math.min(...dates));
  } else {
    startDate = new Date(Date.now() - 9 * 7 * 24 * 60 * 60 * 1000);
  }

  const grouped: Record<string, number> = {};
  revenue.forEach((r) => {
    const date = new Date(r.revenue_date);
    if (date >= startDate) {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      grouped[key] = (grouped[key] || 0) + (revenueByOrder[r.revenue_id] || r.total_revenue);
    }
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, total]) => ({
      week: new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
    }));
}

export function buildTopClients(revenue: Revenue[], revenueLines: RevenueLine[], limit = 5) {
  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((line) => {
    revenueByOrder[line.revenue_id] = (revenueByOrder[line.revenue_id] || 0) + line.line_total;
  });

  const clientMap: Record<string, { orders: number; revenue: number }> = {};
  revenue.forEach((r) => {
    const name = normalizeClientName(r.client_name);
    if (!clientMap[name]) clientMap[name] = { orders: 0, revenue: 0 };
    clientMap[name].orders += 1;
    clientMap[name].revenue += revenueByOrder[r.revenue_id] || r.total_revenue;
  });

  return Object.entries(clientMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function buildTopSuppliers(expenses: Expense[], suppliers: Supplier[], limit = 5) {
  const supplierMap: Record<number, { total: number }> = {};
  expenses.forEach((e) => {
    if (!supplierMap[e.supplier_key]) supplierMap[e.supplier_key] = { total: 0 };
    supplierMap[e.supplier_key].total += e.total_amount;
  });

  const supplierLookup: Record<number, Supplier> = {};
  suppliers.forEach((s) => { supplierLookup[s.supplier_key] = s; });

  return Object.entries(supplierMap)
    .map(([key, d]) => {
      const sup = supplierLookup[Number(key)];
      return { name: sup?.standard_name || `Supplier ${key}`, category: sup?.category || 'General', total: d.total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function buildMenuPerformance(revenueLines: RevenueLine[]) {
  const menuMap: Record<string, { value: number; quantity: number }> = {};
  revenueLines.forEach((line) => {
    if (!menuMap[line.menu_item]) menuMap[line.menu_item] = { value: 0, quantity: 0 };
    menuMap[line.menu_item].value += line.line_total;
    menuMap[line.menu_item].quantity += line.quantity;
  });

  return Object.entries(menuMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.value - a.value);
}

export function computeKPIs(data: DashboardData) {
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
    totalRevenue, totalExpenses, profitLoss, profitMargin,
    totalOrders, avgOrderValue,
    revTrend: percentChange(curMonthRev, prevMonthRev),
    expTrend: percentChange(curMonthExp, prevMonthExp),
    orderTrend: percentChange(curMonthOrders, prevMonthOrders),
  };
}

// ── Helpers ──

export function getUniqueClientNames(revenue: Revenue[]): string[] {
  const names = new Set<string>();
  revenue.forEach((r) => names.add(normalizeClientName(r.client_name)));
  return Array.from(names).sort();
}

export function getUniqueSupplierNames(expenses: Expense[], suppliers: Supplier[]): string[] {
  const lookup: Record<number, string> = {};
  suppliers.forEach((s) => { lookup[s.supplier_key] = s.standard_name; });
  const names = new Set<string>();
  expenses.forEach((e) => {
    const name = lookup[e.supplier_key];
    if (name) names.add(name);
  });
  return Array.from(names).sort();
}
