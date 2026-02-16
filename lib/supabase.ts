import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// ── Type definitions ──

export interface Expense {
  expense_id: string;
  expense_date: string;
  description: string;
  category: string;
  quantity: number | null;
  unit_of_measure: string | null;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  supplier_key: number;
  payment_method: string;
  invoice_number: string;
}

export interface Supplier {
  supplier_key: number;
  standard_name: string;
  category: string;
}

export interface Revenue {
  revenue_id: string;
  revenue_date: string;
  client_name: string;
  pax_count: number;
  total_revenue: number;
}

export interface RevenueLine {
  line_id: string;
  revenue_id: string;
  menu_item: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface FoodUsage {
  staging_id: number;
  usage_date: string;
  poulet_kg: number;
  langoustes_kg: number;
  poisson_kg: number;
  reserve_gambass_pcs: number;
  reserve_langoustes: number;
  total_kg: number;
}

export interface DrinksUsage {
  staging_id: number;
  usage_date: string;
  coca_cola_bottles: number;
  sprite_bottles: number;
  beer_bottles: number;
  rhum_bottles: number;
  rose_bottles: number;
  blanc_bottles: number;
  total_bottles: number;
}

export interface WRRevenue {
  staging_id: number;
  revenue_date: string;
  client_name: string;
  trip_description: string;
  amount: number;
}

// ── Data fetching ──

export async function fetchDashboardData() {
  const [expRes, supRes, revRes, lineRes, foodRes, drinksRes, wrRevRes] = await Promise.all([
    supabase.from('gwr_expenses').select('expense_id,expense_date,description,category,quantity,unit_of_measure,net_amount,vat_amount,total_amount,supplier_key,payment_method,invoice_number').order('expense_date', { ascending: false }),
    supabase.from('gwr_suppliers').select('supplier_key,standard_name,category'),
    supabase.from('gwr_revenue').select('revenue_id,revenue_date,client_name,pax_count,total_revenue').order('revenue_date', { ascending: false }),
    supabase.from('gwr_revenue_lines').select('line_id,revenue_id,menu_item,quantity,unit_price,line_total'),
    supabase.from('gwr_food_usage').select('staging_id,usage_date,poulet_kg,langoustes_kg,poisson_kg,reserve_gambass_pcs,reserve_langoustes,total_kg').order('usage_date', { ascending: false }),
    supabase.from('gwr_drinks_usage').select('staging_id,usage_date,coca_cola_bottles,sprite_bottles,beer_bottles,rhum_bottles,rose_bottles,blanc_bottles,total_bottles').order('usage_date', { ascending: false }),
    supabase.from('gwr_wr_revenue').select('staging_id,revenue_date,client_name,trip_description,amount').order('revenue_date', { ascending: false }),
  ]);

  if (expRes.error) throw expRes.error;
  if (supRes.error) throw supRes.error;
  if (revRes.error) throw revRes.error;
  if (lineRes.error) throw lineRes.error;
  if (foodRes.error) throw foodRes.error;
  if (drinksRes.error) throw drinksRes.error;
  if (wrRevRes.error) throw wrRevRes.error;

  return {
    expenses: (expRes.data || []) as Expense[],
    suppliers: (supRes.data || []) as Supplier[],
    revenue: (revRes.data || []) as Revenue[],
    revenueLines: (lineRes.data || []) as RevenueLine[],
    foodUsage: (foodRes.data || []) as FoodUsage[],
    drinksUsage: (drinksRes.data || []) as DrinksUsage[],
    wrRevenue: (wrRevRes.data || []) as WRRevenue[],
  };
}
