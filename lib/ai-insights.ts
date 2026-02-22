/**
 * AI Insights Engine — Computes business intelligence from real dashboard data.
 * Used by all AI feature components (chat, briefing, anomaly, forecast, demand).
 */

import type { DashboardData } from './data-context';
import type { Expense, Revenue, RevenueLine, FoodUsage, DrinksUsage, WRRevenue, Supplier } from './supabase';
import { computeInventory, buildTopClients, buildTopSuppliers, buildMenuPerformance, classifyFoodExpense } from './processing';
import { formatCurrencyFull, percentChange } from './utils';

// ── Helpers ──

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function monthKey(date: string): string {
  return date.substring(0, 7);
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function prevMonthKey(): string {
  const now = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function dayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay(); // 0=Sun, 6=Sat
}

// ── Chat Insight Functions ──

export interface ChatAnswer {
  text: string;
  highlights?: { label: string; value: string; color?: string }[];
}

export function getRevenueLastWeek(data: DashboardData): ChatAnswer {
  const weekAgo = daysAgo(7);
  const revenueByOrder: Record<string, number> = {};
  data.revenueLines.forEach((l) => {
    revenueByOrder[l.revenue_id] = (revenueByOrder[l.revenue_id] || 0) + l.line_total;
  });

  let total = 0;
  let orderCount = 0;
  data.revenue.forEach((r) => {
    if (r.revenue_date >= weekAgo) {
      total += revenueByOrder[r.revenue_id] || r.total_revenue;
      orderCount++;
    }
  });

  // WR revenue
  (data.wrRevenue || []).forEach((wr) => {
    if (wr.revenue_date >= weekAgo) {
      total += wr.amount || 0;
    }
  });

  // Previous week for comparison
  const twoWeeksAgo = daysAgo(14);
  let prevTotal = 0;
  data.revenue.forEach((r) => {
    if (r.revenue_date >= twoWeeksAgo && r.revenue_date < weekAgo) {
      prevTotal += revenueByOrder[r.revenue_id] || r.total_revenue;
    }
  });
  (data.wrRevenue || []).forEach((wr) => {
    if (wr.revenue_date >= twoWeeksAgo && wr.revenue_date < weekAgo) {
      prevTotal += wr.amount || 0;
    }
  });

  const change = percentChange(total, prevTotal);
  const direction = change >= 0 ? 'up' : 'down';

  return {
    text: `Your revenue over the last 7 days was ${formatCurrencyFull(total)} from ${orderCount} order${orderCount !== 1 ? 's' : ''}. That's ${Math.abs(change).toFixed(1)}% ${direction} compared to the previous week (${formatCurrencyFull(prevTotal)}).`,
    highlights: [
      { label: 'Last 7 Days', value: formatCurrencyFull(total), color: '#7B61FF' },
      { label: 'Previous Week', value: formatCurrencyFull(prevTotal) },
      { label: 'Change', value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, color: change >= 0 ? '#01B574' : '#FF6B6B' },
    ],
  };
}

export function getMostExpensiveSupplier(data: DashboardData): ChatAnswer {
  const top = buildTopSuppliers(data.expenses, data.suppliers, 5);
  if (top.length === 0) {
    return { text: 'No supplier data available yet.' };
  }

  const totalSpend = data.expenses.reduce((s, e) => s + e.total_amount, 0);

  return {
    text: `Your most expensive supplier is ${top[0].name} with a total spend of ${formatCurrencyFull(top[0].total)} (${((top[0].total / totalSpend) * 100).toFixed(1)}% of all expenses). Here are your top 5:`,
    highlights: top.map((s, i) => ({
      label: `#${i + 1} ${s.name}`,
      value: formatCurrencyFull(s.total),
      color: i === 0 ? '#FF6B6B' : undefined,
    })),
  };
}

export function getChickenOrderRecommendation(data: DashboardData): ChatAnswer {
  const inventory = computeInventory(data.expenses, data.foodUsage);
  const chicken = inventory.find((i) => i.productKey === 'poulet');

  if (!chicken) {
    return { text: 'No chicken inventory data available.' };
  }

  const statusColor = chicken.status === 'red' ? '#FF6B6B' : chicken.status === 'yellow' ? '#FFB547' : '#01B574';
  const urgency = chicken.status === 'red' ? 'URGENT' : chicken.status === 'yellow' ? 'Soon' : 'No rush';

  // Recommend enough for 14 days
  const targetDays = 14;
  const needed = Math.max(0, Math.round((chicken.avgDailyUse * targetDays) - chicken.onHand));

  return {
    text: `Current chicken (Poulet) stock: ${chicken.onHand.toFixed(1)} kg with an average daily usage of ${chicken.avgDailyUse} kg/day. That gives you approximately ${chicken.daysSupply} days of supply. ${needed > 0 ? `To maintain a 2-week buffer, order approximately ${needed} kg.` : 'Stock levels are healthy — no immediate order needed.'}`,
    highlights: [
      { label: 'On Hand', value: `${chicken.onHand.toFixed(1)} kg` },
      { label: 'Avg Daily Use', value: `${chicken.avgDailyUse} kg/day` },
      { label: 'Days Supply', value: `${chicken.daysSupply} days`, color: statusColor },
      { label: 'Status', value: urgency, color: statusColor },
      ...(needed > 0 ? [{ label: 'Order', value: `${needed} kg`, color: '#7B61FF' }] : []),
    ],
  };
}

export function getMonthComparison(data: DashboardData): ChatAnswer {
  const curMonth = currentMonthKey();
  const prevMonth = prevMonthKey();

  const revenueByOrder: Record<string, number> = {};
  data.revenueLines.forEach((l) => {
    revenueByOrder[l.revenue_id] = (revenueByOrder[l.revenue_id] || 0) + l.line_total;
  });

  let curRev = 0, prevRev = 0, curExp = 0, prevExp = 0, curOrders = 0, prevOrders = 0;

  data.revenue.forEach((r) => {
    const m = monthKey(r.revenue_date);
    const rev = revenueByOrder[r.revenue_id] || r.total_revenue;
    if (m === curMonth) { curRev += rev; curOrders++; }
    if (m === prevMonth) { prevRev += rev; prevOrders++; }
  });
  (data.wrRevenue || []).forEach((wr) => {
    const m = monthKey(wr.revenue_date);
    if (m === curMonth) curRev += wr.amount || 0;
    if (m === prevMonth) prevRev += wr.amount || 0;
  });
  data.expenses.forEach((e) => {
    const m = monthKey(e.expense_date);
    if (m === curMonth) curExp += e.total_amount;
    if (m === prevMonth) prevExp += e.total_amount;
  });

  const curProfit = curRev - curExp;
  const prevProfit = prevRev - prevExp;
  const revChange = percentChange(curRev, prevRev);
  const expChange = percentChange(curExp, prevExp);

  const curMonthName = new Date(curMonth + '-01').toLocaleDateString('en-US', { month: 'long' });
  const prevMonthName = new Date(prevMonth + '-01').toLocaleDateString('en-US', { month: 'long' });

  return {
    text: `Comparing ${curMonthName} to ${prevMonthName}: Revenue is ${revChange >= 0 ? 'up' : 'down'} ${Math.abs(revChange).toFixed(1)}%, expenses ${expChange >= 0 ? 'up' : 'down'} ${Math.abs(expChange).toFixed(1)}%. You had ${curOrders} orders this month vs ${prevOrders} last month.`,
    highlights: [
      { label: `${curMonthName} Revenue`, value: formatCurrencyFull(curRev), color: '#7B61FF' },
      { label: `${prevMonthName} Revenue`, value: formatCurrencyFull(prevRev) },
      { label: 'Revenue Change', value: `${revChange >= 0 ? '+' : ''}${revChange.toFixed(1)}%`, color: revChange >= 0 ? '#01B574' : '#FF6B6B' },
      { label: `${curMonthName} Profit`, value: formatCurrencyFull(curProfit), color: curProfit >= 0 ? '#01B574' : '#FF6B6B' },
    ],
  };
}

export function getTopMenuItems(data: DashboardData): ChatAnswer {
  const menu = buildMenuPerformance(data.revenueLines).slice(0, 5);
  if (menu.length === 0) return { text: 'No menu item data available yet.' };

  const totalRev = menu.reduce((s, m) => s + m.value, 0);

  return {
    text: `Your top-performing menu items by revenue. ${menu[0].name} leads with ${formatCurrencyFull(menu[0].value)} (${((menu[0].value / totalRev) * 100).toFixed(0)}% of total menu revenue). Here are your top 5:`,
    highlights: menu.map((m, i) => ({
      label: `#${i + 1} ${m.name}`,
      value: `${formatCurrencyFull(m.value)} (${m.quantity} sold)`,
      color: i === 0 ? '#7B61FF' : undefined,
    })),
  };
}

// ── Briefing Insights ──

export interface BriefingSection {
  title: string;
  icon: 'performance' | 'alert' | 'opportunity';
  items: { text: string; type: 'positive' | 'negative' | 'neutral' | 'warning' }[];
}

export function generateBriefing(data: DashboardData): BriefingSection[] {
  const sections: BriefingSection[] = [];

  // Performance
  const perfItems: BriefingSection['items'] = [];
  const yesterday = daysAgo(1);
  const revenueByOrder: Record<string, number> = {};
  data.revenueLines.forEach((l) => {
    revenueByOrder[l.revenue_id] = (revenueByOrder[l.revenue_id] || 0) + l.line_total;
  });

  let yesterdayRev = 0;
  data.revenue.forEach((r) => {
    if (r.revenue_date === yesterday) {
      yesterdayRev += revenueByOrder[r.revenue_id] || r.total_revenue;
    }
  });
  (data.wrRevenue || []).forEach((wr) => {
    if (wr.revenue_date === yesterday) yesterdayRev += wr.amount || 0;
  });

  if (yesterdayRev > 0) {
    perfItems.push({ text: `Yesterday's revenue: ${formatCurrencyFull(yesterdayRev)}`, type: 'positive' });
  } else {
    perfItems.push({ text: 'No revenue recorded yesterday', type: 'neutral' });
  }

  // Weekly profit margin
  const weekAgo = daysAgo(7);
  const twoWeeksAgo = daysAgo(14);
  let thisWeekRev = 0, thisWeekExp = 0, lastWeekRev = 0, lastWeekExp = 0;
  data.revenue.forEach((r) => {
    const rev = revenueByOrder[r.revenue_id] || r.total_revenue;
    if (r.revenue_date >= weekAgo) thisWeekRev += rev;
    else if (r.revenue_date >= twoWeeksAgo) lastWeekRev += rev;
  });
  (data.wrRevenue || []).forEach((wr) => {
    if (wr.revenue_date >= weekAgo) thisWeekRev += wr.amount || 0;
    else if (wr.revenue_date >= twoWeeksAgo) lastWeekRev += wr.amount || 0;
  });
  data.expenses.forEach((e) => {
    if (e.expense_date >= weekAgo) thisWeekExp += e.total_amount;
    else if (e.expense_date >= twoWeeksAgo) lastWeekExp += e.total_amount;
  });

  if (thisWeekRev > 0) {
    const margin = ((thisWeekRev - thisWeekExp) / thisWeekRev * 100);
    const lastMargin = lastWeekRev > 0 ? ((lastWeekRev - lastWeekExp) / lastWeekRev * 100) : 0;
    const improving = margin > lastMargin;
    perfItems.push({
      text: `Profit margin this week: ${margin.toFixed(1)}%${lastWeekRev > 0 ? ` (${improving ? 'improving' : 'declining'} from ${lastMargin.toFixed(1)}% last week)` : ''}`,
      type: improving ? 'positive' : 'negative',
    });
  }

  // Food cost %
  const foodExpenses = data.expenses.filter((e) => classifyFoodExpense(e) !== null && e.expense_date >= weekAgo);
  const foodCost = foodExpenses.reduce((s, e) => s + e.total_amount, 0);
  if (thisWeekRev > 0 && foodCost > 0) {
    const foodPct = (foodCost / thisWeekRev) * 100;
    perfItems.push({
      text: `Food cost ratio (7 days): ${foodPct.toFixed(1)}%${foodPct > 35 ? ' — above target' : ' — within target range'}`,
      type: foodPct > 35 ? 'warning' : 'positive',
    });
  }

  sections.push({ title: 'Performance', icon: 'performance', items: perfItems });

  // Alerts
  const alertItems: BriefingSection['items'] = [];
  const inventory = computeInventory(data.expenses, data.foodUsage);

  inventory.forEach((item) => {
    if (item.status === 'red') {
      alertItems.push({
        text: `${item.product} stock critical — estimated ${item.daysSupply} day${item.daysSupply !== 1 ? 's' : ''} remaining. Reorder recommended.`,
        type: 'negative',
      });
    } else if (item.status === 'yellow') {
      alertItems.push({
        text: `${item.product} stock getting low — ${item.daysSupply} days supply remaining.`,
        type: 'warning',
      });
    }
  });

  // Drinks consumption anomaly
  const curMonth = currentMonthKey();
  const curDrinks: Record<string, number> = {};
  const avgDrinks: Record<string, number[]> = {};
  data.drinksUsage.forEach((d) => {
    const m = monthKey(d.usage_date);
    const total = (d.coca_cola_bottles || 0) + (d.sprite_bottles || 0) + (d.beer_bottles || 0) + (d.rhum_bottles || 0) + (d.rose_bottles || 0) + (d.blanc_bottles || 0);
    if (m === curMonth) {
      curDrinks['total'] = (curDrinks['total'] || 0) + total;
    }
    if (!avgDrinks[m]) avgDrinks[m] = [];
    avgDrinks[m].push(total);
  });

  const monthlyDrinksTotals = Object.entries(avgDrinks)
    .filter(([m]) => m !== curMonth)
    .map(([, vals]) => vals.reduce((a, b) => a + b, 0));
  if (monthlyDrinksTotals.length >= 2 && curDrinks['total'] > 0) {
    const avgMonthly = monthlyDrinksTotals.reduce((a, b) => a + b, 0) / monthlyDrinksTotals.length;
    const diff = ((curDrinks['total'] - avgMonthly) / avgMonthly) * 100;
    if (diff > 20) {
      alertItems.push({
        text: `Beverage consumption up ${diff.toFixed(0)}% this month vs average — verify with staff.`,
        type: 'warning',
      });
    }
  }

  if (alertItems.length === 0) {
    alertItems.push({ text: 'No critical alerts — all systems healthy.', type: 'positive' });
  }
  sections.push({ title: 'Alerts', icon: 'alert', items: alertItems });

  // Opportunities
  const oppItems: BriefingSection['items'] = [];

  // Clients with no recent orders
  const clientLastOrder: Record<string, string> = {};
  data.revenue.forEach((r) => {
    const name = r.client_name;
    if (!clientLastOrder[name] || r.revenue_date > clientLastOrder[name]) {
      clientLastOrder[name] = r.revenue_date;
    }
  });
  const thirtyDaysAgo = daysAgo(30);
  const dormantClients = Object.entries(clientLastOrder)
    .filter(([, lastDate]) => lastDate < thirtyDaysAgo)
    .sort(([, a], [, b]) => b.localeCompare(a));
  if (dormantClients.length > 0) {
    const daysSince = Math.floor((Date.now() - new Date(dormantClients[0][1]).getTime()) / (1000 * 60 * 60 * 24));
    oppItems.push({
      text: `Client "${dormantClients[0][0]}" hasn't ordered in ${daysSince} days — consider outreach.${dormantClients.length > 1 ? ` (${dormantClients.length} dormant clients total)` : ''}`,
      type: 'neutral',
    });
  }

  // Best day of week
  const revByDow: Record<number, number[]> = {};
  data.revenue.forEach((r) => {
    const dow = dayOfWeek(r.revenue_date);
    if (!revByDow[dow]) revByDow[dow] = [];
    revByDow[dow].push(revenueByOrder[r.revenue_id] || r.total_revenue);
  });
  const dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let bestDow = 0, bestAvg = 0;
  Object.entries(revByDow).forEach(([dow, vals]) => {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg > bestAvg) { bestAvg = avg; bestDow = Number(dow); }
  });
  if (bestAvg > 0) {
    oppItems.push({
      text: `${dowNames[bestDow]} is your strongest day (avg ${formatCurrencyFull(bestAvg)}/order) — ensure full prep.`,
      type: 'positive',
    });
  }

  // Top menu item suggestion
  const menu = buildMenuPerformance(data.revenueLines);
  if (menu.length >= 3) {
    oppItems.push({
      text: `"${menu[0].name}" is your top revenue item. Consider featuring it more prominently.`,
      type: 'neutral',
    });
  }

  sections.push({ title: 'Opportunities', icon: 'opportunity', items: oppItems });

  return sections;
}

// ── Anomaly Detection ──

export interface AnomalyAlert {
  id: string;
  severity: 'red' | 'yellow' | 'blue';
  title: string;
  description: string;
  impact?: string;
}

export function detectAnomalies(data: DashboardData): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  // Build supplier lookup
  const supplierLookup: Record<number, string> = {};
  data.suppliers.forEach((s) => { supplierLookup[s.supplier_key] = s.standard_name; });

  // Group expenses by supplier
  const supplierExpenses: Record<string, Expense[]> = {};
  data.expenses.forEach((e) => {
    const name = e.supplier_name?.trim() || supplierLookup[e.supplier_key] || `Supplier ${e.supplier_key}`;
    if (!supplierExpenses[name]) supplierExpenses[name] = [];
    supplierExpenses[name].push(e);
  });

  Object.entries(supplierExpenses).forEach(([name, expenses]) => {
    // Sort by date
    const sorted = [...expenses].sort((a, b) => a.expense_date.localeCompare(b.expense_date));

    // Price spike detection: compare recent unit prices vs historical avg
    const withPrice = sorted.filter((e) => (e.quantity ?? 0) > 0 && e.net_amount > 0);
    if (withPrice.length >= 4) {
      const recent = withPrice.slice(-3);
      const historical = withPrice.slice(0, -3);
      const recentAvgPrice = recent.reduce((s, e) => s + e.net_amount / (e.quantity ?? 1), 0) / recent.length;
      const histAvgPrice = historical.reduce((s, e) => s + e.net_amount / (e.quantity ?? 1), 0) / historical.length;

      if (histAvgPrice > 0) {
        const pricePctChange = ((recentAvgPrice - histAvgPrice) / histAvgPrice) * 100;
        if (pricePctChange > 15) {
          const monthlyImpact = recent.reduce((s, e) => s + e.total_amount, 0) / recent.length * 4;
          alerts.push({
            id: `price-${name}`,
            severity: 'red',
            title: `Price Spike — ${name}`,
            description: `Average unit price increased from ${formatCurrencyFull(histAvgPrice)} to ${formatCurrencyFull(recentAvgPrice)} (+${pricePctChange.toFixed(1)}%) in recent purchases. This is significantly above historical average.`,
            impact: `Estimated monthly impact: +${formatCurrencyFull(monthlyImpact - (monthlyImpact / (1 + pricePctChange / 100)))}`,
          });
        }
      }
    }

    // Volume anomaly: current month vs 3-month avg
    const curMonth = currentMonthKey();
    const curMonthTotal = sorted.filter((e) => monthKey(e.expense_date) === curMonth).reduce((s, e) => s + e.total_amount, 0);

    const monthlyTotals: Record<string, number> = {};
    sorted.forEach((e) => {
      const m = monthKey(e.expense_date);
      if (m !== curMonth) {
        monthlyTotals[m] = (monthlyTotals[m] || 0) + e.total_amount;
      }
    });

    const prevMonths = Object.values(monthlyTotals);
    if (prevMonths.length >= 3 && curMonthTotal > 0) {
      const avg3m = prevMonths.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const volumePct = ((curMonthTotal - avg3m) / avg3m) * 100;
      if (volumePct > 30) {
        alerts.push({
          id: `volume-${name}`,
          severity: 'yellow',
          title: `Unusual Volume — ${name}`,
          description: `Spending this month (${formatCurrencyFull(curMonthTotal)}) is ${volumePct.toFixed(0)}% above the 3-month average (${formatCurrencyFull(avg3m)}). This may indicate increased demand or over-ordering.`,
        });
      }
    }
  });

  // Limit to top 5 most important
  return alerts
    .sort((a, b) => {
      const sev = { red: 0, yellow: 1, blue: 2 };
      return sev[a.severity] - sev[b.severity];
    })
    .slice(0, 5);
}

// ── Revenue Forecast ──

export interface ForecastPoint {
  month: string;
  revenue: number;
  expenses: number;
  isForecast?: boolean;
  revUpper?: number;
  revLower?: number;
}

export function generateRevenueForecast(
  monthlyData: { month: string; revenue: number; expenses: number }[],
): { data: ForecastPoint[]; projectedRevenue: number; projectedMargin: number; marginChange: number } {
  if (monthlyData.length < 3) {
    return { data: monthlyData, projectedRevenue: 0, projectedMargin: 0, marginChange: 0 };
  }

  // Linear regression on last 6+ months
  const n = Math.min(monthlyData.length, 12);
  const recent = monthlyData.slice(-n);

  // Revenue trend
  const revXY = recent.map((d, i) => ({ x: i, y: d.revenue }));
  const revTrend = linearRegression(revXY);

  // Expenses trend
  const expXY = recent.map((d, i) => ({ x: i, y: d.expenses }));
  const expTrend = linearRegression(expXY);

  // Standard deviation for confidence band
  const revResiduals = revXY.map((p) => p.y - (revTrend.slope * p.x + revTrend.intercept));
  const revStdDev = Math.sqrt(revResiduals.reduce((s, r) => s + r * r, 0) / revResiduals.length);

  // Build combined data
  const combined: ForecastPoint[] = recent.map((d) => ({ ...d }));

  // Add 3 forecast months
  const lastMonth = recent[recent.length - 1];
  let totalForecastRev = 0;
  let totalForecastExp = 0;
  for (let i = 1; i <= 3; i++) {
    const x = n - 1 + i;
    const revForecast = Math.max(0, revTrend.slope * x + revTrend.intercept);
    const expForecast = Math.max(0, expTrend.slope * x + expTrend.intercept);
    totalForecastRev += revForecast;
    totalForecastExp += expForecast;

    // Generate month label
    const lastDate = parseMonthLabel(lastMonth.month);
    if (lastDate) {
      lastDate.setMonth(lastDate.getMonth() + i);
      combined.push({
        month: lastDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Math.round(revForecast),
        expenses: Math.round(expForecast),
        isForecast: true,
        revUpper: Math.round(revForecast + revStdDev * 1.2),
        revLower: Math.round(Math.max(0, revForecast - revStdDev * 1.2)),
      });
    }
  }

  const projectedMargin = totalForecastRev > 0 ? ((totalForecastRev - totalForecastExp) / totalForecastRev) * 100 : 0;

  // Current margin for comparison
  const last3 = recent.slice(-3);
  const curRev = last3.reduce((s, d) => s + d.revenue, 0);
  const curExp = last3.reduce((s, d) => s + d.expenses, 0);
  const curMargin = curRev > 0 ? ((curRev - curExp) / curRev) * 100 : 0;

  return {
    data: combined,
    projectedRevenue: Math.round(totalForecastRev),
    projectedMargin: Math.round(projectedMargin * 10) / 10,
    marginChange: Math.round((projectedMargin - curMargin) * 10) / 10,
  };
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function parseMonthLabel(label: string): Date | null {
  // Parse "Jan '25" or "Feb '26" format
  const match = label.match(/^([A-Za-z]+)\s+'(\d{2})$/);
  if (!match) return null;
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const m = months[match[1]];
  if (m === undefined) return null;
  return new Date(2000 + parseInt(match[2]), m, 1);
}

// ── Demand Forecast ──

export interface DemandForecastPoint {
  day: string;
  dayLabel: string;
  poulet: number;
  langoustes: number;
  poisson: number;
}

export interface OrderRecommendation {
  product: string;
  productKey: string;
  currentStock: number;
  avgDailyUse: number;
  daysUntilStockout: number;
  suggestedOrder: number;
  priority: 'urgent' | 'medium' | 'low';
}

export function generateDemandForecast(data: DashboardData): {
  forecast: DemandForecastPoint[];
  recommendations: OrderRecommendation[];
} {
  const { foodUsage, expenses } = data;

  // Calculate day-of-week patterns
  const dowUsage: Record<number, { poulet: number[]; langoustes: number[]; poisson: number[] }> = {};
  for (let d = 0; d < 7; d++) {
    dowUsage[d] = { poulet: [], langoustes: [], poisson: [] };
  }

  foodUsage.forEach((f) => {
    const dow = dayOfWeek(f.usage_date);
    dowUsage[dow].poulet.push(f.poulet_kg || 0);
    dowUsage[dow].langoustes.push(f.langoustes_kg || 0);
    dowUsage[dow].poisson.push(f.poisson_kg || 0);
  });

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // Global average as fallback
  const globalAvg = {
    poulet: avg(foodUsage.map((f) => f.poulet_kg || 0)),
    langoustes: avg(foodUsage.map((f) => f.langoustes_kg || 0)),
    poisson: avg(foodUsage.map((f) => f.poisson_kg || 0)),
  };

  // Build 7-day forecast
  const forecast: DemandForecastPoint[] = [];
  const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();

    forecast.push({
      day: d.toISOString().split('T')[0],
      dayLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dowNames[dow],
      poulet: Math.round((dowUsage[dow].poulet.length >= 2 ? avg(dowUsage[dow].poulet) : globalAvg.poulet) * 10) / 10,
      langoustes: Math.round((dowUsage[dow].langoustes.length >= 2 ? avg(dowUsage[dow].langoustes) : globalAvg.langoustes) * 10) / 10,
      poisson: Math.round((dowUsage[dow].poisson.length >= 2 ? avg(dowUsage[dow].poisson) : globalAvg.poisson) * 10) / 10,
    });
  }

  // Recommendations based on current inventory
  const inventory = computeInventory(expenses, foodUsage);
  const totalForecast7d = {
    poulet: forecast.reduce((s, f) => s + f.poulet, 0),
    langoustes: forecast.reduce((s, f) => s + f.langoustes, 0),
    poisson: forecast.reduce((s, f) => s + f.poisson, 0),
  };

  const recommendations: OrderRecommendation[] = inventory.map((item) => {
    const forecast7d = totalForecast7d[item.productKey];
    const daysUntilStockout = item.avgDailyUse > 0 ? Math.floor(item.onHand / item.avgDailyUse) : 999;
    const needed14d = Math.max(0, Math.round(item.avgDailyUse * 14 - item.onHand));

    let priority: 'urgent' | 'medium' | 'low';
    if (daysUntilStockout < 3 || item.status === 'red') priority = 'urgent';
    else if (daysUntilStockout < 7 || item.status === 'yellow') priority = 'medium';
    else priority = 'low';

    return {
      product: item.product,
      productKey: item.productKey,
      currentStock: Math.round(item.onHand * 10) / 10,
      avgDailyUse: item.avgDailyUse,
      daysUntilStockout,
      suggestedOrder: needed14d,
      priority,
    };
  });

  // Sort: urgent first
  recommendations.sort((a, b) => {
    const p = { urgent: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });

  return { forecast, recommendations };
}
