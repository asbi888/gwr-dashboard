import type { Expense, DrinksUsage } from './supabase';

// ── Types ──

export type DrinksCategory = 'beer_soft' | 'wine_rhum';

export interface DailyDrinksCostRow {
  date: string;
  beer_soft_bottles: number;
  wine_rhum_bottles: number;
  beer_soft_cost: number;
  wine_rhum_cost: number;
  total_cost: number;
}

export interface DrinksCostResult {
  rows: DailyDrinksCostRow[];
  avgCostPerBottle: { beer_soft: number; wine_rhum: number };
  totals: { beer_soft: number; wine_rhum: number; grand: number };
  /** Drinks expenses that lack bottle quantity — included in grand total but not in daily breakdown */
  unweightedCosts: { beer_soft: number; wine_rhum: number; grand: number };
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

// ── Classification ──

const BOTTLES_PER_CRATE = 24;

export function classifyDrinksExpense(expense: Expense): DrinksCategory | null {
  const cat = (expense.category || '').toLowerCase();
  const desc = (expense.description || '').toLowerCase();

  // Category match (most reliable — from ExpenseForm dropdown)
  if (cat === 'beer & soft drinks') return 'beer_soft';
  if (cat === 'wine & rhum') return 'wine_rhum';

  // Description fallback
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

// ── Compute daily drinks costs ──

export function computeDailyDrinksCosts(
  expenses: Expense[],
  drinksUsage: DrinksUsage[]
): DrinksCostResult {
  // Step 1: Accumulate expense amounts and bottle counts per category
  const sums = {
    beer_soft: { amount: 0, bottles: 0 },
    wine_rhum: { amount: 0, bottles: 0 },
  };
  const unweightedCosts = { beer_soft: 0, wine_rhum: 0, grand: 0 };

  expenses.forEach((e) => {
    const cat = classifyDrinksExpense(e);
    if (!cat) return;

    const uom = (e.unit_of_measure || '').toLowerCase();
    const hasBottles = e.quantity && e.quantity > 0
      && (uom === 'bottles' || uom === 'btl' || uom === 'pcs' || uom === 'crates' || uom === 'pack');

    if (hasBottles) {
      let bottleQty = e.quantity!;
      if (uom === 'crates') bottleQty *= BOTTLES_PER_CRATE;

      sums[cat].amount += e.net_amount;
      sums[cat].bottles += bottleQty;
    } else {
      unweightedCosts[cat] += e.net_amount;
      unweightedCosts.grand += e.net_amount;
    }
  });

  // Step 2: Weighted average cost per bottle
  const avgCostPerBottle = {
    beer_soft: sums.beer_soft.bottles > 0 ? sums.beer_soft.amount / sums.beer_soft.bottles : 0,
    wine_rhum: sums.wine_rhum.bottles > 0 ? sums.wine_rhum.amount / sums.wine_rhum.bottles : 0,
  };

  // Step 3: For each usage day, compute daily cost
  const rows: DailyDrinksCostRow[] = drinksUsage.map((d) => {
    const beer_soft_bottles =
      (d.coca_cola_bottles || 0) + (d.sprite_bottles || 0) + (d.beer_bottles || 0);
    const wine_rhum_bottles =
      (d.rhum_bottles || 0) + (d.rose_bottles || 0) + (d.blanc_bottles || 0);

    const beer_soft_cost = beer_soft_bottles * avgCostPerBottle.beer_soft;
    const wine_rhum_cost = wine_rhum_bottles * avgCostPerBottle.wine_rhum;

    return {
      date: d.usage_date,
      beer_soft_bottles,
      wine_rhum_bottles,
      beer_soft_cost,
      wine_rhum_cost,
      total_cost: beer_soft_cost + wine_rhum_cost,
    };
  });

  // Step 4: Sort by date descending
  rows.sort((a, b) => b.date.localeCompare(a.date));

  // Step 5: Totals
  const totals = rows.reduce(
    (acc, r) => ({
      beer_soft: acc.beer_soft + r.beer_soft_cost,
      wine_rhum: acc.wine_rhum + r.wine_rhum_cost,
      grand: acc.grand + r.total_cost,
    }),
    { beer_soft: 0, wine_rhum: 0, grand: 0 }
  );

  // Include unweighted costs in grand total
  totals.grand += unweightedCosts.grand;

  return { rows, avgCostPerBottle, totals, unweightedCosts };
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
