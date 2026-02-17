import { supabase } from './supabase';
import type { Expense, Revenue, RevenueLine, FoodUsage, DrinksUsage, WRRevenue } from './supabase';

// ── Food Usage CRUD ──

export async function insertFoodUsage(
  data: Omit<FoodUsage, 'staging_id'>,
): Promise<FoodUsage> {
  const total_kg =
    (data.poulet_kg || 0) + (data.langoustes_kg || 0) + (data.poisson_kg || 0);

  const { data: result, error } = await supabase
    .from('gwr_food_usage')
    .insert({ ...data, total_kg })
    .select()
    .single();

  if (error) throw error;
  return result as FoodUsage;
}

export async function updateFoodUsage(
  staging_id: number,
  data: Partial<Omit<FoodUsage, 'staging_id'>>,
): Promise<FoodUsage> {
  // Recompute total if any kg field changed
  const payload: Record<string, unknown> = { ...data };
  if ('poulet_kg' in data || 'langoustes_kg' in data || 'poisson_kg' in data) {
    payload.total_kg =
      (data.poulet_kg ?? 0) + (data.langoustes_kg ?? 0) + (data.poisson_kg ?? 0);
  }

  const { data: result, error } = await supabase
    .from('gwr_food_usage')
    .update(payload)
    .eq('staging_id', staging_id)
    .select()
    .single();

  if (error) throw error;
  return result as FoodUsage;
}

export async function deleteFoodUsage(staging_id: number): Promise<void> {
  const { error } = await supabase
    .from('gwr_food_usage')
    .delete()
    .eq('staging_id', staging_id);

  if (error) throw error;
}

// ── Drinks Usage CRUD ──

export async function insertDrinksUsage(
  data: Omit<DrinksUsage, 'staging_id'>,
): Promise<DrinksUsage> {
  const total_bottles =
    (data.coca_cola_bottles || 0) +
    (data.sprite_bottles || 0) +
    (data.beer_bottles || 0) +
    (data.rhum_bottles || 0) +
    (data.rose_bottles || 0) +
    (data.blanc_bottles || 0);

  const { data: result, error } = await supabase
    .from('gwr_drinks_usage')
    .insert({ ...data, total_bottles })
    .select()
    .single();

  if (error) throw error;
  return result as DrinksUsage;
}

export async function updateDrinksUsage(
  staging_id: number,
  data: Partial<Omit<DrinksUsage, 'staging_id'>>,
): Promise<DrinksUsage> {
  const payload: Record<string, unknown> = { ...data };
  const bottleFields = [
    'coca_cola_bottles', 'sprite_bottles', 'beer_bottles',
    'rhum_bottles', 'rose_bottles', 'blanc_bottles',
  ] as const;
  if (bottleFields.some((f) => f in data)) {
    payload.total_bottles = bottleFields.reduce(
      (sum, f) => sum + ((data as Record<string, number>)[f] ?? 0),
      0,
    );
  }

  const { data: result, error } = await supabase
    .from('gwr_drinks_usage')
    .update(payload)
    .eq('staging_id', staging_id)
    .select()
    .single();

  if (error) throw error;
  return result as DrinksUsage;
}

export async function deleteDrinksUsage(staging_id: number): Promise<void> {
  const { error } = await supabase
    .from('gwr_drinks_usage')
    .delete()
    .eq('staging_id', staging_id);

  if (error) throw error;
}

// ── WR Revenue CRUD ──

export async function insertWRRevenue(
  data: Omit<WRRevenue, 'staging_id'>,
): Promise<WRRevenue> {
  const { data: result, error } = await supabase
    .from('gwr_wr_revenue')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result as WRRevenue;
}

export async function updateWRRevenue(
  staging_id: number,
  data: Partial<Omit<WRRevenue, 'staging_id'>>,
): Promise<WRRevenue> {
  const { data: result, error } = await supabase
    .from('gwr_wr_revenue')
    .update(data)
    .eq('staging_id', staging_id)
    .select()
    .single();

  if (error) throw error;
  return result as WRRevenue;
}

export async function deleteWRRevenue(staging_id: number): Promise<void> {
  const { error } = await supabase
    .from('gwr_wr_revenue')
    .delete()
    .eq('staging_id', staging_id);

  if (error) throw error;
}

// ── Expenses CRUD ──

export async function insertExpense(
  data: Omit<Expense, 'expense_id'>,
): Promise<Expense> {
  const expense_id = crypto.randomUUID();
  const total_amount = (data.net_amount || 0) + (data.vat_amount || 0);

  // Exclude supplier_key to avoid FK constraint — we use supplier_name instead
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { supplier_key: _sk, ...rest } = data;

  const { data: result, error } = await supabase
    .from('gwr_expenses')
    .insert({ ...rest, expense_id, total_amount })
    .select()
    .single();

  if (error) throw error;
  return result as Expense;
}

export async function updateExpense(
  expense_id: string,
  data: Partial<Omit<Expense, 'expense_id'>>,
): Promise<Expense> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { supplier_key: _sk, ...rest } = data;
  const payload: Record<string, unknown> = { ...rest };
  if ('net_amount' in data || 'vat_amount' in data) {
    payload.total_amount = (data.net_amount ?? 0) + (data.vat_amount ?? 0);
  }

  const { data: result, error } = await supabase
    .from('gwr_expenses')
    .update(payload)
    .eq('expense_id', expense_id)
    .select()
    .single();

  if (error) throw error;
  return result as Expense;
}

export async function deleteExpense(expense_id: string): Promise<void> {
  const { error } = await supabase
    .from('gwr_expenses')
    .delete()
    .eq('expense_id', expense_id);

  if (error) throw error;
}

// ── Revenue CRUD (parent + lines) ──

export async function insertRevenue(
  header: Omit<Revenue, 'revenue_id'>,
  lines: Omit<RevenueLine, 'line_id' | 'revenue_id'>[],
): Promise<Revenue> {
  const revenue_id = crypto.randomUUID();
  const total_revenue = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  // Insert header
  const { data: rev, error: revErr } = await supabase
    .from('gwr_revenue')
    .insert({ ...header, revenue_id, total_revenue })
    .select()
    .single();

  if (revErr) throw revErr;

  // Insert lines
  if (lines.length > 0) {
    const lineRows = lines.map((l) => ({
      line_id: crypto.randomUUID(),
      revenue_id,
      ...l,
      line_total: l.quantity * l.unit_price,
    }));

    const { error: lineErr } = await supabase
      .from('gwr_revenue_lines')
      .insert(lineRows);

    if (lineErr) throw lineErr;
  }

  return rev as Revenue;
}

export async function updateRevenue(
  revenue_id: string,
  data: Partial<Omit<Revenue, 'revenue_id'>>,
): Promise<Revenue> {
  const { data: result, error } = await supabase
    .from('gwr_revenue')
    .update(data)
    .eq('revenue_id', revenue_id)
    .select()
    .single();

  if (error) throw error;
  return result as Revenue;
}

export async function deleteRevenue(revenue_id: string): Promise<void> {
  // Delete lines first
  const { error: lineErr } = await supabase
    .from('gwr_revenue_lines')
    .delete()
    .eq('revenue_id', revenue_id);

  if (lineErr) throw lineErr;

  // Delete header
  const { error } = await supabase
    .from('gwr_revenue')
    .delete()
    .eq('revenue_id', revenue_id);

  if (error) throw error;
}

// ── Revenue Lines CRUD ──

export async function insertRevenueLine(
  data: Omit<RevenueLine, 'line_id'>,
): Promise<RevenueLine> {
  const line_id = crypto.randomUUID();
  const line_total = data.quantity * data.unit_price;

  const { data: result, error } = await supabase
    .from('gwr_revenue_lines')
    .insert({ ...data, line_id, line_total })
    .select()
    .single();

  if (error) throw error;
  return result as RevenueLine;
}

export async function updateRevenueLine(
  line_id: string,
  data: Partial<Omit<RevenueLine, 'line_id'>>,
): Promise<RevenueLine> {
  const payload: Record<string, unknown> = { ...data };
  if ('quantity' in data || 'unit_price' in data) {
    payload.line_total = (data.quantity ?? 0) * (data.unit_price ?? 0);
  }

  const { data: result, error } = await supabase
    .from('gwr_revenue_lines')
    .update(payload)
    .eq('line_id', line_id)
    .select()
    .single();

  if (error) throw error;
  return result as RevenueLine;
}

export async function deleteRevenueLine(line_id: string): Promise<void> {
  const { error } = await supabase
    .from('gwr_revenue_lines')
    .delete()
    .eq('line_id', line_id);

  if (error) throw error;
}
