import type { Expense, Supplier, Revenue, RevenueLine, FoodUsage, DrinksUsage, WRRevenue } from './supabase';
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
    foodUsage: data.foodUsage,
    drinksUsage: data.drinksUsage,
    wrRevenue: data.wrRevenue,
  };
}

// ── Data processing helpers ──

export function buildMonthlyChart(
  revenue: Revenue[],
  revenueLines: RevenueLine[],
  expenses: Expense[],
  wrRevenue?: WRRevenue[],
) {
  const revenueByOrder: Record<string, number> = {};
  revenueLines.forEach((line) => {
    revenueByOrder[line.revenue_id] = (revenueByOrder[line.revenue_id] || 0) + line.line_total;
  });

  const revByMonth: Record<string, number> = {};
  revenue.forEach((r) => {
    const key = r.revenue_date.substring(0, 7);
    revByMonth[key] = (revByMonth[key] || 0) + (revenueByOrder[r.revenue_id] || r.total_revenue);
  });

  // Include WR revenue in monthly totals
  (wrRevenue || []).forEach((wr) => {
    const key = wr.revenue_date.substring(0, 7);
    revByMonth[key] = (revByMonth[key] || 0) + (wr.amount || 0);
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
  // Build lookup from supplier_key for legacy records
  const supplierLookup: Record<number, Supplier> = {};
  suppliers.forEach((s) => { supplierLookup[s.supplier_key] = s; });

  // Group by supplier name (prefer supplier_name field, fall back to key lookup)
  const nameMap: Record<string, { total: number; category: string }> = {};
  expenses.forEach((e) => {
    const sup = supplierLookup[e.supplier_key];
    const name = e.supplier_name?.trim() || sup?.standard_name || `Supplier ${e.supplier_key}`;
    const category = sup?.category || 'General';
    if (!nameMap[name]) nameMap[name] = { total: 0, category };
    nameMap[name].total += e.total_amount;
  });

  return Object.entries(nameMap)
    .map(([name, d]) => ({ name, category: d.category, total: d.total }))
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
  const { expenses, revenue, revenueLines, wrRevenue } = data;

  const cateringRevenue = revenueLines.reduce((sum, l) => sum + l.line_total, 0);
  const wrRevenueTotal = (wrRevenue || []).reduce((sum, w) => sum + (w.amount || 0), 0);
  const totalRevenue = cateringRevenue + wrRevenueTotal;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0);
  const profitLoss = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profitLoss / totalRevenue) * 100 : 0;
  const totalOrders = revenue.length;
  const avgOrderValue = totalOrders > 0 ? cateringRevenue / totalOrders : 0;

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

  // Include WR revenue in monthly trends
  (wrRevenue || []).forEach((wr) => {
    const m = wr.revenue_date.substring(0, 7);
    if (m === currentMonth) curMonthRev += wr.amount || 0;
    if (m === prevMonthKey) prevMonthRev += wr.amount || 0;
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
  // Build lookup from supplier_key for legacy records
  const lookup: Record<number, string> = {};
  suppliers.forEach((s) => { lookup[s.supplier_key] = s.standard_name; });

  const names = new Set<string>();
  expenses.forEach((e) => {
    // Prefer supplier_name (new field), fall back to supplier_key lookup
    const name = e.supplier_name?.trim() || lookup[e.supplier_key];
    if (name) names.add(name);
  });
  return Array.from(names).sort();
}

// ── Food expense classification (mirrors ETL CATEGORY_KEYWORDS) ──

export function classifyFoodExpense(expense: Expense): 'poulet' | 'langoustes' | 'poisson' | null {
  const desc = (expense.description || '').toLowerCase();
  const cat = (expense.category || '').toLowerCase();

  if (cat === 'chicken' || cat.includes('poultry') || desc.includes('chicken') || desc.includes('poulet')) {
    return 'poulet';
  }
  if (cat === 'lobster' || desc.includes('langouste') || desc.includes('lobster') || desc.includes('gambas')) {
    return 'langoustes';
  }
  if (cat === 'fish' || desc.includes('poisson') || desc.includes('fish')) {
    return 'poisson';
  }
  if (cat.includes('seafood')) {
    return 'poisson'; // Default seafood to poisson
  }
  return null;
}

// ── Inventory calculations ──

export interface InventoryItem {
  product: string;
  productKey: 'poulet' | 'langoustes' | 'poisson';
  purchased: number;
  used: number;
  onHand: number;
  avgDailyUse: number;
  daysSupply: number;
  status: 'green' | 'yellow' | 'red';
}

export function computeInventory(expenses: Expense[], foodUsage: FoodUsage[]): InventoryItem[] {
  // Sum purchased kg from expenses
  const purchased = { poulet: 0, langoustes: 0, poisson: 0 };
  expenses.forEach((e) => {
    const product = classifyFoodExpense(e);
    if (product && e.quantity && (e.unit_of_measure || '').toLowerCase() === 'kg') {
      purchased[product] += e.quantity;
    }
  });

  // Sum used kg from food_usage
  const used = {
    poulet: foodUsage.reduce((s, f) => s + (f.poulet_kg || 0), 0),
    langoustes: foodUsage.reduce((s, f) => s + (f.langoustes_kg || 0), 0),
    poisson: foodUsage.reduce((s, f) => s + (f.poisson_kg || 0), 0),
  };

  const usageDays = new Set(foodUsage.map((f) => f.usage_date)).size || 1;

  const products: { key: 'poulet' | 'langoustes' | 'poisson'; label: string }[] = [
    { key: 'poulet', label: 'Chicken (Poulet)' },
    { key: 'langoustes', label: 'Langoustes' },
    { key: 'poisson', label: 'Fish (Poisson)' },
  ];

  return products.map(({ key, label }) => {
    const onHand = purchased[key] - used[key];
    const avgDaily = used[key] / usageDays;
    const daysSupply = avgDaily > 0 ? Math.round(onHand / avgDaily) : (onHand > 0 ? 999 : 0);

    let status: 'green' | 'yellow' | 'red';
    if (onHand < 0 || daysSupply < 3) status = 'red';
    else if (onHand < 100 || daysSupply < 7) status = 'yellow';
    else status = 'green';

    return {
      product: label,
      productKey: key,
      purchased: purchased[key],
      used: used[key],
      onHand,
      avgDailyUse: Math.round(avgDaily * 10) / 10,
      daysSupply,
      status,
    };
  });
}

// ── Food purchase vs usage chart ──

export interface FoodChartPoint {
  month: string;
  purchasedPoulet: number;
  usedPoulet: number;
  purchasedLangoustes: number;
  usedLangoustes: number;
  purchasedPoisson: number;
  usedPoisson: number;
}

export function buildFoodPurchaseVsUsage(
  expenses: Expense[],
  foodUsage: FoodUsage[],
): FoodChartPoint[] {
  const purchaseByMonth: Record<string, { poulet: number; langoustes: number; poisson: number }> = {};
  expenses.forEach((e) => {
    const product = classifyFoodExpense(e);
    if (product && e.quantity && (e.unit_of_measure || '').toLowerCase() === 'kg') {
      const month = e.expense_date.substring(0, 7);
      if (!purchaseByMonth[month]) purchaseByMonth[month] = { poulet: 0, langoustes: 0, poisson: 0 };
      purchaseByMonth[month][product] += e.quantity;
    }
  });

  const usageByMonth: Record<string, { poulet: number; langoustes: number; poisson: number }> = {};
  foodUsage.forEach((f) => {
    const month = f.usage_date.substring(0, 7);
    if (!usageByMonth[month]) usageByMonth[month] = { poulet: 0, langoustes: 0, poisson: 0 };
    usageByMonth[month].poulet += f.poulet_kg || 0;
    usageByMonth[month].langoustes += f.langoustes_kg || 0;
    usageByMonth[month].poisson += f.poisson_kg || 0;
  });

  const allMonths = [...new Set([...Object.keys(purchaseByMonth), ...Object.keys(usageByMonth)])].sort();

  return allMonths.map((m) => ({
    month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    purchasedPoulet: Math.round(purchaseByMonth[m]?.poulet || 0),
    usedPoulet: Math.round(usageByMonth[m]?.poulet || 0),
    purchasedLangoustes: Math.round(purchaseByMonth[m]?.langoustes || 0),
    usedLangoustes: Math.round(usageByMonth[m]?.langoustes || 0),
    purchasedPoisson: Math.round(purchaseByMonth[m]?.poisson || 0),
    usedPoisson: Math.round(usageByMonth[m]?.poisson || 0),
  }));
}

// ── Drinks consumption ──

export interface DrinksSummary {
  name: string;
  total: number;
  color: string;
}

export function buildDrinksSummary(drinksUsage: DrinksUsage[]): DrinksSummary[] {
  const totals = {
    'Coca-Cola': 0,
    'Sprite': 0,
    'Beer': 0,
    'Rhum': 0,
    'Rose Wine': 0,
    'Blanc Wine': 0,
  };

  drinksUsage.forEach((d) => {
    totals['Coca-Cola'] += d.coca_cola_bottles || 0;
    totals['Sprite'] += d.sprite_bottles || 0;
    totals['Beer'] += d.beer_bottles || 0;
    totals['Rhum'] += d.rhum_bottles || 0;
    totals['Rose Wine'] += d.rose_bottles || 0;
    totals['Blanc Wine'] += d.blanc_bottles || 0;
  });

  const colors: Record<string, string> = {
    'Coca-Cola': '#FF6B6B',
    'Beer': '#FFB547',
    'Rhum': '#7B61FF',
    'Rose Wine': '#D53F8C',
    'Blanc Wine': '#4FD1C5',
    'Sprite': '#38B2AC',
  };

  return Object.entries(totals)
    .map(([name, total]) => ({ name, total, color: colors[name] || '#A0AEC0' }))
    .sort((a, b) => b.total - a.total);
}
