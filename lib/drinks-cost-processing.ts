import type { Expense, DrinksUsage } from './supabase';

// ── Standard cost per bottle (from Power BI reference prices) ──

export const DRINK_UNIT_COSTS = {
  coca_cola: 40,
  sprite: 40,
  beer: 89,
  blanc: 104,
  rose: 104,
  rhum: 260,
} as const;

export type DrinkKey = keyof typeof DRINK_UNIT_COSTS;

export const DRINK_LABELS: Record<DrinkKey, string> = {
  coca_cola: 'Coca-Cola',
  sprite: 'Sprite',
  beer: 'Beer',
  blanc: 'Blanc Wine',
  rose: 'Rosé Wine',
  rhum: 'Rhum',
};

// ── Types ──

export type DrinksCategory = 'beer_soft' | 'wine_rhum';

export interface DailyDrinksCostRow {
  date: string;
  coca_cola_btl: number;
  sprite_btl: number;
  beer_btl: number;
  rhum_btl: number;
  rose_btl: number;
  blanc_btl: number;
  coca_cola_cost: number;
  sprite_cost: number;
  beer_cost: number;
  rhum_cost: number;
  rose_cost: number;
  blanc_cost: number;
  total_cost: number;
}

export interface DrinksCostResult {
  rows: DailyDrinksCostRow[];
  totals: {
    coca_cola: number; sprite: number; beer: number;
    rhum: number; rose: number; blanc: number;
    grand: number;
  };
}

export interface DrinksPurchaseRow {
  expense_id: string;
  expense_date: string;
  description: string;
  supplier_name: string;
  quantity: number | null;
  unit_of_measure: string | null;
  net_amount: number;
  category: string;
  drinks_category: DrinksCategory;
}

// ── Classification (still used for purchases table) ──

export function classifyDrinksExpense(expense: Expense): DrinksCategory | null {
  const cat = (expense.category || '').toLowerCase();
  const desc = (expense.description || '').toLowerCase();

  if (cat === 'beer & soft drinks') return 'beer_soft';
  if (cat === 'wine & rhum') return 'wine_rhum';

  if (desc.includes('coca') || desc.includes('sprite') || desc.includes('beer')
      || desc.includes('soft drink') || desc.includes('soda')) {
    return 'beer_soft';
  }
  if (desc.includes('wine') || desc.includes('rhum') || desc.includes('rum')
      || desc.includes('rosé') || desc.includes('rose') || desc.includes('blanc')
      || desc.includes('vin')) {
    return 'wine_rhum';
  }

  return null;
}

// ── Compute daily drinks costs using standard unit costs ──

export function computeDailyDrinksCosts(
  drinksUsage: DrinksUsage[]
): DrinksCostResult {
  const rows: DailyDrinksCostRow[] = drinksUsage.map((d) => {
    const coca_cola_btl = d.coca_cola_bottles || 0;
    const sprite_btl = d.sprite_bottles || 0;
    const beer_btl = d.beer_bottles || 0;
    const rhum_btl = d.rhum_bottles || 0;
    const rose_btl = d.rose_bottles || 0;
    const blanc_btl = d.blanc_bottles || 0;

    const coca_cola_cost = coca_cola_btl * DRINK_UNIT_COSTS.coca_cola;
    const sprite_cost = sprite_btl * DRINK_UNIT_COSTS.sprite;
    const beer_cost = beer_btl * DRINK_UNIT_COSTS.beer;
    const rhum_cost = rhum_btl * DRINK_UNIT_COSTS.rhum;
    const rose_cost = rose_btl * DRINK_UNIT_COSTS.rose;
    const blanc_cost = blanc_btl * DRINK_UNIT_COSTS.blanc;

    return {
      date: d.usage_date,
      coca_cola_btl, sprite_btl, beer_btl, rhum_btl, rose_btl, blanc_btl,
      coca_cola_cost, sprite_cost, beer_cost, rhum_cost, rose_cost, blanc_cost,
      total_cost: coca_cola_cost + sprite_cost + beer_cost + rhum_cost + rose_cost + blanc_cost,
    };
  });

  // Sort by date descending
  rows.sort((a, b) => b.date.localeCompare(a.date));

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      coca_cola: acc.coca_cola + r.coca_cola_cost,
      sprite: acc.sprite + r.sprite_cost,
      beer: acc.beer + r.beer_cost,
      rhum: acc.rhum + r.rhum_cost,
      rose: acc.rose + r.rose_cost,
      blanc: acc.blanc + r.blanc_cost,
      grand: acc.grand + r.total_cost,
    }),
    { coca_cola: 0, sprite: 0, beer: 0, rhum: 0, rose: 0, blanc: 0, grand: 0 }
  );

  return { rows, totals };
}

// ── Get drinks-related expenses ──

export function getDrinksPurchases(expenses: Expense[]): DrinksPurchaseRow[] {
  const result: DrinksPurchaseRow[] = [];

  expenses.forEach((e) => {
    const drinks_category = classifyDrinksExpense(e);
    if (drinks_category) {
      result.push({
        expense_id: e.expense_id,
        expense_date: e.expense_date,
        description: e.description,
        supplier_name: e.supplier_name || 'Unknown',
        quantity: e.quantity,
        unit_of_measure: e.unit_of_measure,
        net_amount: e.net_amount,
        category: e.category,
        drinks_category,
      });
    }
  });

  result.sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  return result;
}
