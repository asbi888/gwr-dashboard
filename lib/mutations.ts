import type { Expense, Revenue, RevenueLine, FoodUsage, DrinksUsage, WRRevenue } from './supabase';

// ── Helper: call the server-side mutations API route ──

async function mutate<T = unknown>(body: {
  action: 'insert' | 'update' | 'delete';
  table: string;
  data?: Record<string, unknown>;
  match?: Record<string, unknown>;
}): Promise<T> {
  const res = await fetch('/api/mutations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `Mutation failed (${res.status})`);
  }

  return json.data as T;
}

// ── Food Usage CRUD ──

export async function insertFoodUsage(
  data: Omit<FoodUsage, 'staging_id'>,
): Promise<FoodUsage> {
  const total_kg =
    (data.poulet_kg || 0) + (data.langoustes_kg || 0) + (data.poisson_kg || 0);

  return mutate<FoodUsage>({
    action: 'insert',
    table: 'gwr_food_usage',
    data: { ...data, total_kg },
  });
}

export async function updateFoodUsage(
  staging_id: number,
  data: Partial<Omit<FoodUsage, 'staging_id'>>,
): Promise<FoodUsage> {
  const payload: Record<string, unknown> = { ...data };
  if ('poulet_kg' in data || 'langoustes_kg' in data || 'poisson_kg' in data) {
    payload.total_kg =
      (data.poulet_kg ?? 0) + (data.langoustes_kg ?? 0) + (data.poisson_kg ?? 0);
  }

  return mutate<FoodUsage>({
    action: 'update',
    table: 'gwr_food_usage',
    data: payload,
    match: { staging_id },
  });
}

export async function deleteFoodUsage(staging_id: number): Promise<void> {
  await mutate({
    action: 'delete',
    table: 'gwr_food_usage',
    match: { staging_id },
  });
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

  return mutate<DrinksUsage>({
    action: 'insert',
    table: 'gwr_drinks_usage',
    data: { ...data, total_bottles },
  });
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

  return mutate<DrinksUsage>({
    action: 'update',
    table: 'gwr_drinks_usage',
    data: payload,
    match: { staging_id },
  });
}

export async function deleteDrinksUsage(staging_id: number): Promise<void> {
  await mutate({
    action: 'delete',
    table: 'gwr_drinks_usage',
    match: { staging_id },
  });
}

// ── WR Revenue CRUD ──

export async function insertWRRevenue(
  data: Omit<WRRevenue, 'staging_id'>,
): Promise<WRRevenue> {
  return mutate<WRRevenue>({
    action: 'insert',
    table: 'gwr_wr_revenue',
    data: { ...data },
  });
}

export async function updateWRRevenue(
  staging_id: number,
  data: Partial<Omit<WRRevenue, 'staging_id'>>,
): Promise<WRRevenue> {
  return mutate<WRRevenue>({
    action: 'update',
    table: 'gwr_wr_revenue',
    data: { ...data },
    match: { staging_id },
  });
}

export async function deleteWRRevenue(staging_id: number): Promise<void> {
  await mutate({
    action: 'delete',
    table: 'gwr_wr_revenue',
    match: { staging_id },
  });
}

// ── Expenses CRUD ──

export async function insertExpense(
  data: Omit<Expense, 'expense_id'>,
): Promise<Expense> {
  const expense_id = crypto.randomUUID();
  const total_amount = (data.net_amount || 0) + (data.vat_amount || 0);

  // Exclude supplier_key to avoid FK constraint
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { supplier_key: _sk, ...rest } = data;

  return mutate<Expense>({
    action: 'insert',
    table: 'gwr_expenses',
    data: { ...rest, expense_id, total_amount },
  });
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

  return mutate<Expense>({
    action: 'update',
    table: 'gwr_expenses',
    data: payload,
    match: { expense_id },
  });
}

export async function deleteExpense(expense_id: string): Promise<void> {
  await mutate({
    action: 'delete',
    table: 'gwr_expenses',
    match: { expense_id },
  });
}

// ── Revenue CRUD (parent + lines) ──

export async function insertRevenue(
  header: Omit<Revenue, 'revenue_id'>,
  lines: Omit<RevenueLine, 'line_id' | 'revenue_id'>[],
): Promise<Revenue> {
  const revenue_id = crypto.randomUUID();
  const total_revenue = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  // Insert header
  const rev = await mutate<Revenue>({
    action: 'insert',
    table: 'gwr_revenue',
    data: { ...header, revenue_id, total_revenue },
  });

  // Insert lines one by one
  for (const l of lines) {
    await mutate({
      action: 'insert',
      table: 'gwr_revenue_lines',
      data: {
        line_id: crypto.randomUUID(),
        revenue_id,
        ...l,
        line_total: l.quantity * l.unit_price,
      },
    });
  }

  return rev;
}

export async function updateRevenue(
  revenue_id: string,
  data: Partial<Omit<Revenue, 'revenue_id'>>,
): Promise<Revenue> {
  return mutate<Revenue>({
    action: 'update',
    table: 'gwr_revenue',
    data: { ...data },
    match: { revenue_id },
  });
}

export async function deleteRevenue(revenue_id: string): Promise<void> {
  // Delete lines first
  try {
    await mutate({
      action: 'delete',
      table: 'gwr_revenue_lines',
      match: { revenue_id },
    });
  } catch {
    // Lines may not exist — ignore "not found" errors
  }

  // Delete header
  await mutate({
    action: 'delete',
    table: 'gwr_revenue',
    match: { revenue_id },
  });
}

// ── Revenue Lines CRUD ──

export async function insertRevenueLine(
  data: Omit<RevenueLine, 'line_id'>,
): Promise<RevenueLine> {
  const line_id = crypto.randomUUID();
  const line_total = data.quantity * data.unit_price;

  return mutate<RevenueLine>({
    action: 'insert',
    table: 'gwr_revenue_lines',
    data: { ...data, line_id, line_total },
  });
}

export async function updateRevenueLine(
  line_id: string,
  data: Partial<Omit<RevenueLine, 'line_id'>>,
): Promise<RevenueLine> {
  const payload: Record<string, unknown> = { ...data };
  if ('quantity' in data || 'unit_price' in data) {
    payload.line_total = (data.quantity ?? 0) * (data.unit_price ?? 0);
  }

  return mutate<RevenueLine>({
    action: 'update',
    table: 'gwr_revenue_lines',
    data: payload,
    match: { line_id },
  });
}

export async function deleteRevenueLine(line_id: string): Promise<void> {
  await mutate({
    action: 'delete',
    table: 'gwr_revenue_lines',
    match: { line_id },
  });
}
