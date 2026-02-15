import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Type definitions ──

export interface Expense {
  expense_id: string;
  expense_date: string;
  description: string;
  category: string;
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

// ── Data fetching ──

export async function fetchDashboardData() {
  const [expRes, supRes, revRes, lineRes] = await Promise.all([
    supabase.from('gwr_expenses').select('expense_id,expense_date,description,category,net_amount,vat_amount,total_amount,supplier_key,payment_method,invoice_number').order('expense_date', { ascending: false }),
    supabase.from('gwr_suppliers').select('supplier_key,standard_name,category'),
    supabase.from('gwr_revenue').select('revenue_id,revenue_date,client_name,pax_count,total_revenue').order('revenue_date', { ascending: false }),
    supabase.from('gwr_revenue_lines').select('line_id,revenue_id,menu_item,quantity,unit_price,line_total'),
  ]);

  if (expRes.error) throw expRes.error;
  if (supRes.error) throw supRes.error;
  if (revRes.error) throw revRes.error;
  if (lineRes.error) throw lineRes.error;

  return {
    expenses: (expRes.data || []) as Expense[],
    suppliers: (supRes.data || []) as Supplier[],
    revenue: (revRes.data || []) as Revenue[],
    revenueLines: (lineRes.data || []) as RevenueLine[],
  };
}
