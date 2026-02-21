import type { GeneralLedgerEntry } from './supabase';

// ── Balance Sheet category types ──

type BSCategory =
  | 'Current Assets'
  | 'Non-current Assets'
  | 'Current Liabilities'
  | 'Equity'
  | 'Income'
  | 'Expense'
  | 'Exclude';  // accounts that cancel out and shouldn't appear on BS

interface AccountClassification {
  category: BSCategory;
  subcategory: string;
  /** Debit-normal accounts show positive when debit > credit */
  normalBalance: 'debit' | 'credit';
}

// ── Odoo account_id → Balance Sheet classification ──
// Built from the actual account_id / account_name pairs in the GL export.
// Verified against Odoo's own Balance Sheet report as of 31/05/2025.

const ACCOUNT_CLASSIFICATION: Record<number, AccountClassification> = {
  // ── Current Assets ──
  133: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },       // 110100 Stock Valuation
  136: { category: 'Current Assets', subcategory: 'Receivables', normalBalance: 'debit' },           // 121000 Account Receivable
  139: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 131000 Tax Paid
  141: { category: 'Current Assets', subcategory: 'Prepayments', normalBalance: 'debit' },           // 141000 Prepayments
  171: { category: 'Current Assets', subcategory: 'Bank and Cash Accounts', normalBalance: 'debit' },// 230001 Bank
  234: { category: 'Current Assets', subcategory: 'Bank and Cash Accounts', normalBalance: 'debit' },// 9003 Cash in hand
  259: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110302 Inventory chicken
  260: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110301 Inventory fish
  261: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110303 Inventory lobster 500G
  262: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110304 Inventory lobster 200G
  263: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110305 Inventory lobster 400G
  264: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110306 Inventory gambass 100G
  265: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110307 Inventory Rhum Bottle
  266: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110308 Inventory wine white Bottle
  267: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110309 Inventory wine rosé Bottle
  268: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110310 Inventory beer bottle
  269: { category: 'Current Assets', subcategory: 'Current Assets', normalBalance: 'debit' },        // 110311 Inventory coca bottle

  // ── Non-current Assets ──
  143: { category: 'Non-current Assets', subcategory: 'Non-current Assets', normalBalance: 'debit' }, // 191000 Non-current assets

  // ── Current Liabilities ──
  145: { category: 'Current Liabilities', subcategory: 'Payables', normalBalance: 'credit' },              // 211000 Account Payable
  150: { category: 'Current Liabilities', subcategory: 'Current Liabilities', normalBalance: 'credit' },   // 251000 Tax Received
  254: { category: 'Current Liabilities', subcategory: 'Current Liabilities', normalBalance: 'credit' },   // 1200004 Vat liabilities
  256: { category: 'Current Liabilities', subcategory: 'Current Liabilities', normalBalance: 'credit' },   // 1200006 Current tax liabilities

  // ── Equity ──
  243: { category: 'Equity', subcategory: 'Retained Earnings', normalBalance: 'credit' },             // 100001 Share capital
  244: { category: 'Equity', subcategory: 'Retained Earnings', normalBalance: 'credit' },             // 100002 Retained earnings

  // ── Income (rolls into Unallocated Earnings in Equity) ──
  155: { category: 'Income', subcategory: 'Revenue', normalBalance: 'credit' },                       // 400000 Product Sales
  177: { category: 'Income', subcategory: 'Revenue', normalBalance: 'credit' },                       // 10001 Direct sales

  // ── Expenses (rolls into Unallocated Earnings in Equity) ──
  181: { category: 'Expense', subcategory: 'Cost of Sales', normalBalance: 'debit' },                 // 20001 Release of inventory
  182: { category: 'Expense', subcategory: 'Cost of Sales', normalBalance: 'debit' },                 // 20002 Other purchase materials
  183: { category: 'Expense', subcategory: 'Cost of Sales', normalBalance: 'debit' },                 // 20003 Direct labour costs
  185: { category: 'Expense', subcategory: 'Other Expenses', normalBalance: 'debit' },                // 3000 Other expenses
  186: { category: 'Expense', subcategory: 'Other Expenses', normalBalance: 'debit' },                // 30001 Administrative expenses
  187: { category: 'Expense', subcategory: 'Other Expenses', normalBalance: 'debit' },                // 30002 Bank charges
  189: { category: 'Expense', subcategory: 'Other Expenses', normalBalance: 'debit' },                // 30004 Repairs and maintenance
  196: { category: 'Expense', subcategory: 'Other Expenses', normalBalance: 'debit' },                // 30011 Boat insurance
  200: { category: 'Expense', subcategory: 'Payroll', normalBalance: 'debit' },                       // 40001 Basic salary
  201: { category: 'Expense', subcategory: 'Payroll', normalBalance: 'debit' },                       // 40002 CSG
  204: { category: 'Expense', subcategory: 'Other Expenses', normalBalance: 'debit' },                // 40005 Fuel
  213: { category: 'Expense', subcategory: 'Taxation', normalBalance: 'debit' },                      // 70001 Income tax

  // ── Accounts 674/693/688: secondary accounts used for customer invoices ──
  674: { category: 'Current Assets', subcategory: 'Receivables', normalBalance: 'debit' },            // Account Receivable
  693: { category: 'Income', subcategory: 'Revenue', normalBalance: 'credit' },                       // Product Sales
  688: { category: 'Current Liabilities', subcategory: 'Current Liabilities', normalBalance: 'credit' }, // Tax Received
};

// ── Display-friendly account name (keep COA code prefix to match Odoo) ──

function cleanAccountName(name: string): string {
  return name;
}

// ── Result types ──

export interface BSAccount {
  accountId: number;
  name: string;
  balance: number; // positive = normal direction
}

export interface BSSection {
  title: string;
  subcategories: { name: string; accounts: BSAccount[] }[];
  total: number;
}

export interface BalanceSheet {
  asOfDate: string;
  currentAssets: BSSection;
  nonCurrentAssets: BSSection;
  totalAssets: number;
  currentLiabilities: BSSection;
  totalLiabilities: number;
  equity: BSSection;
  totalEquity: number;
  netIncome: number;
  isBalanced: boolean;
  difference: number;
}

// ── Core computation ──

export function computeBalanceSheet(
  entries: GeneralLedgerEntry[],
  asOfDate: string
): BalanceSheet {
  // 1. Filter entries up to the selected date
  const filtered = entries.filter((e) => e.date <= asOfDate);

  // 2. Sum debit - credit per account_id
  const balances: Record<number, { name: string; net: number }> = {};
  for (const e of filtered) {
    if (!balances[e.account_id]) {
      balances[e.account_id] = { name: e.account_name, net: 0 };
    }
    balances[e.account_id].net += e.debit - e.credit;
  }

  // 3. Classify accounts and build sections
  const sectionData: Record<BSCategory, BSAccount[]> = {
    'Current Assets': [],
    'Non-current Assets': [],
    'Current Liabilities': [],
    'Equity': [],
    'Income': [],
    'Expense': [],
    'Exclude': [],
  };

  for (const [idStr, { name, net }] of Object.entries(balances)) {
    const id = parseInt(idStr, 10);
    const classification = ACCOUNT_CLASSIFICATION[id];

    if (!classification || classification.category === 'Exclude') {
      continue;
    }

    // For display: show balance in its natural direction (positive)
    const displayBalance =
      classification.normalBalance === 'debit' ? net : -net;

    sectionData[classification.category].push({
      accountId: id,
      name: cleanAccountName(name),
      balance: displayBalance,
    });
  }

  // 4. Calculate Unallocated Earnings (Revenue - Expenses)
  // This matches Odoo's "Unallocated Earnings" in the Equity section
  const totalIncome = sectionData['Income'].reduce((s, a) => s + a.balance, 0);
  const totalExpenses = sectionData['Expense'].reduce((s, a) => s + a.balance, 0);
  const netIncome = totalIncome - totalExpenses;

  // 5. Build structured sections (matching Odoo's subcategory grouping)
  const buildSection = (
    title: string,
    category: BSCategory
  ): BSSection => {
    const accounts = sectionData[category].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Group by subcategory
    const subcatMap: Record<string, BSAccount[]> = {};
    for (const acct of accounts) {
      const cls = ACCOUNT_CLASSIFICATION[acct.accountId];
      const sub = cls?.subcategory || 'Other';
      if (!subcatMap[sub]) subcatMap[sub] = [];
      subcatMap[sub].push(acct);
    }

    const subcategories = Object.entries(subcatMap).map(([name, accts]) => ({
      name,
      accounts: accts,
    }));

    return {
      title,
      subcategories,
      total: accounts.reduce((s, a) => s + a.balance, 0),
    };
  };

  const currentAssets = buildSection('Current Assets', 'Current Assets');
  const nonCurrentAssets = buildSection('Non-current Assets', 'Non-current Assets');
  const totalAssets = currentAssets.total + nonCurrentAssets.total;

  const currentLiabilities = buildSection('Current Liabilities', 'Current Liabilities');
  const totalLiabilities = currentLiabilities.total;

  // Equity: explicit equity accounts + Unallocated Earnings (net income)
  const equitySection = buildSection('Equity', 'Equity');
  equitySection.subcategories.push({
    name: 'Unallocated Earnings',
    accounts: [{ accountId: -1, name: 'Current Year Unallocated Earnings', balance: netIncome }],
  });
  equitySection.total += netIncome;
  const totalEquity = equitySection.total;

  // 6. Accounting equation check
  const difference = round2(totalAssets - totalLiabilities - totalEquity);

  return {
    asOfDate,
    currentAssets,
    nonCurrentAssets,
    totalAssets: round2(totalAssets),
    currentLiabilities,
    totalLiabilities: round2(totalLiabilities),
    equity: equitySection,
    totalEquity: round2(totalEquity),
    netIncome: round2(netIncome),
    isBalanced: Math.abs(difference) < 0.01,
    difference,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Utility: available date range from GL entries ──

export function getGLDateRange(entries: GeneralLedgerEntry[]): {
  min: string;
  max: string;
} {
  if (entries.length === 0) return { min: '', max: '' };
  let min = entries[0].date;
  let max = entries[0].date;
  for (const e of entries) {
    if (e.date < min) min = e.date;
    if (e.date > max) max = e.date;
  }
  return { min, max };
}
