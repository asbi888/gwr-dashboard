import type { Expense } from './supabase';

// ── Supplier → Odoo Account Mapping (from Power BI SupplierAccountMap) ──

export const SUPPLIER_ACCOUNT_MAP: Record<string, string> = {
  'Amal': '211000',
  'A.S.P Supplies Ltd': '211000',
  'Ben': '211000',
  'Best Foods Distribitors': '211000',
  'Chong and Sons': '211000',
  'Eagle insurance': '211000',
  'Employees Salary': '630000',
  'Engen La Caroline': '211000',
  'Engine Filling Station': '211000',
  'Fresh Chicken Cold Storage': '211000',
  'Froid de l\'Est Ltée': '211000',
  'Jhuboo Videsh': '211000',
  'K. Nepaulsing & Co Ltd': '211000',
  'Les Caves Du Roi Ltd': '211000',
  'Lucky Brand Ltd': '211000',
  'Lyn and Sea Co Ltd': '211000',
  'Mag Leung Kiang': '211000',
  'Phoenix Beverages': '211000',
  'Raju': '211000',
  'Sanit': '211000',
  'Total filling station': '211000',
  'Winners': '211000',
  'Yado Pro Works': '211000',
};

// Default account for unmapped suppliers
const DEFAULT_ACCOUNT = '211000';

// ── COA Account Labels (for display) ──

export const ACCOUNT_LABELS: Record<string, string> = {
  '211000': 'Account Payable',
  '630000': 'Salary Expenses',
};

// ── Resolve supplier name to Odoo account code ──

export function getSupplierAccount(supplierName: string): string {
  // Exact match first
  if (SUPPLIER_ACCOUNT_MAP[supplierName]) {
    return SUPPLIER_ACCOUNT_MAP[supplierName];
  }
  // Case-insensitive match
  const lower = supplierName.toLowerCase();
  for (const [key, value] of Object.entries(SUPPLIER_ACCOUNT_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }
  return DEFAULT_ACCOUNT;
}

// ── Odoo Export Row ──

export interface OdooExportRow {
  expense_id: string;
  date: string;           // YYYY-MM-DD
  supplier: string;
  invoice_number: string;
  description: string;
  kg: number | null;
  amount: number;         // net_amount
  vat_amount: number;
  account: string;        // Odoo COA code
  isMapped: boolean;      // true if supplier is in the map
}

// ── Transform expenses to Odoo export rows ──

export function buildOdooExportRows(expenses: Expense[]): OdooExportRow[] {
  return expenses
    .map((e) => {
      const supplierName = e.supplier_name || 'Unknown';
      const account = getSupplierAccount(supplierName);
      const isMapped = !!SUPPLIER_ACCOUNT_MAP[supplierName] ||
        Object.keys(SUPPLIER_ACCOUNT_MAP).some(
          (k) => k.toLowerCase() === supplierName.toLowerCase()
        );

      return {
        expense_id: e.expense_id,
        date: e.expense_date,
        supplier: supplierName,
        invoice_number: e.invoice_number || '',
        description: e.description || '',
        kg: e.quantity && e.quantity > 0 && (e.unit_of_measure || '').toLowerCase() === 'kg'
          ? e.quantity
          : null,
        amount: e.net_amount,
        vat_amount: e.vat_amount,
        account,
        isMapped,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Generate CSV in Odoo vendor bill import format ──

export function generateOdooCsv(rows: OdooExportRow[]): string {
  const header = 'Date,Supplier,Invoice Number ,Description,Kg,Amount (Rs),VAT Amount';

  const lines = rows.map((r) => {
    const date = `${r.date} 00:00:00`;
    const supplier = r.supplier;
    const invoice = r.invoice_number ? r.invoice_number : '""';
    const description = r.description;
    const kg = r.kg != null ? r.kg.toString() : '';
    const amount = `Rs${r.amount}`;
    const vat = r.vat_amount > 0 ? `Rs${r.vat_amount}` : '';

    // Escape fields with commas
    const escapeField = (val: string) =>
      val.includes(',') ? `"${val.replace(/"/g, '""')}"` : val;

    return [
      date,
      escapeField(supplier),
      invoice,
      escapeField(description),
      kg,
      amount,
      vat,
    ].join(',');
  });

  return [header, ...lines].join('\n');
}

// ── Export summary stats ──

export interface OdooExportSummary {
  totalRows: number;
  totalAmount: number;
  totalVat: number;
  mappedCount: number;
  unmappedCount: number;
  unmappedSuppliers: string[];
  supplierCount: number;
}

export function getExportSummary(rows: OdooExportRow[]): OdooExportSummary {
  const unmappedNames = new Set<string>();
  const allSuppliers = new Set<string>();
  let mappedCount = 0;
  let unmappedCount = 0;
  let totalAmount = 0;
  let totalVat = 0;

  rows.forEach((r) => {
    allSuppliers.add(r.supplier);
    totalAmount += r.amount;
    totalVat += r.vat_amount;
    if (r.isMapped) {
      mappedCount++;
    } else {
      unmappedCount++;
      unmappedNames.add(r.supplier);
    }
  });

  return {
    totalRows: rows.length,
    totalAmount,
    totalVat,
    mappedCount,
    unmappedCount,
    unmappedSuppliers: Array.from(unmappedNames).sort(),
    supplierCount: allSuppliers.size,
  };
}
