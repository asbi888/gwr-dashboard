import type { Expense, FoodUsage } from './supabase';
import { classifyFoodExpense } from './processing';

// ── Types ──

export interface DailyFoodCostRow {
  date: string;
  poulet_kg: number;
  poisson_kg: number;
  langoustes_kg: number;
  poulet_cost: number;
  poisson_cost: number;
  langoustes_cost: number;
  total_cost: number;
}

export interface FoodCostResult {
  rows: DailyFoodCostRow[];
  avgCostPerKg: { poulet: number; poisson: number; langoustes: number };
  totals: { poulet: number; poisson: number; langoustes: number; grand: number };
}

export interface IngredientExpenseRow {
  expense_id: string;
  expense_date: string;
  description: string;
  supplier_name: string;
  quantity: number | null;
  unit_of_measure: string | null;
  net_amount: number;
  category: string;
  product: 'poulet' | 'langoustes' | 'poisson';
}

// ── Compute daily food costs ──

export function computeDailyFoodCosts(
  expenses: Expense[],
  foodUsage: FoodUsage[]
): FoodCostResult {
  // Step 1: Compute weighted average cost per kg for each product
  const sums = {
    poulet: { amount: 0, kg: 0 },
    poisson: { amount: 0, kg: 0 },
    langoustes: { amount: 0, kg: 0 },
  };

  expenses.forEach((e) => {
    const product = classifyFoodExpense(e);
    if (product && e.quantity && e.quantity > 0 && (e.unit_of_measure || '').toLowerCase() === 'kg') {
      sums[product].amount += e.net_amount;
      sums[product].kg += e.quantity;
    }
  });

  const avgCostPerKg = {
    poulet: sums.poulet.kg > 0 ? sums.poulet.amount / sums.poulet.kg : 0,
    poisson: sums.poisson.kg > 0 ? sums.poisson.amount / sums.poisson.kg : 0,
    langoustes: sums.langoustes.kg > 0 ? sums.langoustes.amount / sums.langoustes.kg : 0,
  };

  // Step 2: For each food_usage date, compute daily cost
  const rows: DailyFoodCostRow[] = foodUsage.map((f) => {
    const poulet_cost = (f.poulet_kg || 0) * avgCostPerKg.poulet;
    const poisson_cost = (f.poisson_kg || 0) * avgCostPerKg.poisson;
    const langoustes_cost = (f.langoustes_kg || 0) * avgCostPerKg.langoustes;

    return {
      date: f.usage_date,
      poulet_kg: f.poulet_kg || 0,
      poisson_kg: f.poisson_kg || 0,
      langoustes_kg: f.langoustes_kg || 0,
      poulet_cost,
      poisson_cost,
      langoustes_cost,
      total_cost: poulet_cost + poisson_cost + langoustes_cost,
    };
  });

  // Step 3: Sort by date descending (most recent first)
  rows.sort((a, b) => b.date.localeCompare(a.date));

  // Totals
  const totals = rows.reduce(
    (acc, r) => ({
      poulet: acc.poulet + r.poulet_cost,
      poisson: acc.poisson + r.poisson_cost,
      langoustes: acc.langoustes + r.langoustes_cost,
      grand: acc.grand + r.total_cost,
    }),
    { poulet: 0, poisson: 0, langoustes: 0, grand: 0 }
  );

  return { rows, avgCostPerKg, totals };
}

// ── Get ingredient (food-related) expenses ──

export function getIngredientExpenses(expenses: Expense[]): IngredientExpenseRow[] {
  const result: IngredientExpenseRow[] = [];

  expenses.forEach((e) => {
    const product = classifyFoodExpense(e);
    if (product) {
      result.push({
        expense_id: e.expense_id,
        expense_date: e.expense_date,
        description: e.description,
        supplier_name: e.supplier_name || 'Unknown',
        quantity: e.quantity,
        unit_of_measure: e.unit_of_measure,
        net_amount: e.net_amount,
        category: e.category,
        product,
      });
    }
  });

  // Sort by date descending
  result.sort((a, b) => b.expense_date.localeCompare(a.expense_date));
  return result;
}
