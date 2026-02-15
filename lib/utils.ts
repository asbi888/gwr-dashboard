// Format currency in Mauritian Rupees
export function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `Rs ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rs ${(amount / 1_000).toFixed(1)}K`;
  }
  return `Rs ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Format full currency without abbreviation
export function formatCurrencyFull(amount: number): string {
  return `Rs ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Format percentage
export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// Get month name from date string
export function getMonthName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// Get week label from date
export function getWeekLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group data by month
export function groupByMonth<T extends { [key: string]: unknown }>(
  items: T[],
  dateField: string,
  valueField: string
): { month: string; total: number }[] {
  const grouped: Record<string, number> = {};

  items.forEach((item) => {
    const date = new Date(item[dateField] as string);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    grouped[key] = (grouped[key] || 0) + (item[valueField] as number);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      total,
    }));
}

// Group data by week (last N weeks)
export function groupByWeek<T extends { [key: string]: unknown }>(
  items: T[],
  dateField: string,
  valueField: string,
  weeks: number = 9
): { week: string; total: number }[] {
  const now = new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startDate = new Date(now.getTime() - weeks * msPerWeek);

  const grouped: Record<string, number> = {};

  items.forEach((item) => {
    const date = new Date(item[dateField] as string);
    if (date >= startDate) {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().split('T')[0];
      grouped[key] = (grouped[key] || 0) + (item[valueField] as number);
    }
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, total]) => ({
      week: new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
    }));
}

// Calculate percentage change between two values
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Truncate text
export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// ── Filter types ──

export type DatePreset = 'this_month' | 'last_month' | 'last_3_months' | 'all_time' | 'custom';

export interface DateRange {
  from: string | null; // ISO date string YYYY-MM-DD
  to: string | null;
}

export interface DashboardFilters {
  datePreset: DatePreset;
  dateRange: DateRange;
  clientName: string | null; // null = all clients
}

export const DEFAULT_FILTERS: DashboardFilters = {
  datePreset: 'all_time',
  dateRange: { from: null, to: null },
  clientName: null,
};

// Resolve a DatePreset into concrete from/to ISO strings
export function resolvePresetToRange(preset: DatePreset, customRange: DateRange): DateRange {
  const now = new Date();
  switch (preset) {
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: from.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      };
    }
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0],
      };
    }
    case 'last_3_months': {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return {
        from: from.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      };
    }
    case 'custom':
      return customRange;
    case 'all_time':
    default:
      return { from: null, to: null };
  }
}

// Format relative time for "Updated Xs ago"
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

// Format a date string for display
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
