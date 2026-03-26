'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import type { Expense, Supplier } from '@/lib/supabase';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

interface ExpenseDetailTableProps {
  expenses: Expense[];
  suppliers: Supplier[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

type SortField = 'expense_date' | 'supplier' | 'invoice_number' | 'net_amount' | 'vat_amount' | 'total_amount' | 'payment_method';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

interface InvoiceGroup {
  key: string;
  invoice_number: string;
  expense_date: string;
  supplier_name: string;
  supplier_key: number;
  payment_method: string;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  lines: Expense[];
}

export default function ExpenseDetailTable({ expenses, suppliers, onEdit, onDelete }: ExpenseDetailTableProps) {
  const [sortField, setSortField] = useState<SortField>('expense_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const supplierLookup = useMemo(() => {
    const map: Record<number, string> = {};
    suppliers.forEach((s) => { map[s.supplier_key] = s.standard_name; });
    return map;
  }, [suppliers]);

  // Group expenses by invoice_number + supplier_key
  const groups = useMemo<InvoiceGroup[]>(() => {
    const map = new Map<string, InvoiceGroup>();
    for (const e of expenses) {
      const key = `${e.supplier_key}__${e.invoice_number || e.expense_id}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          invoice_number: e.invoice_number || '—',
          expense_date: e.expense_date,
          supplier_name: e.supplier_name || supplierLookup[e.supplier_key] || `#${e.supplier_key}`,
          supplier_key: e.supplier_key,
          payment_method: e.payment_method || '—',
          net_amount: 0,
          vat_amount: 0,
          total_amount: 0,
          lines: [],
        });
      }
      const g = map.get(key)!;
      g.net_amount += e.net_amount;
      g.vat_amount += e.vat_amount;
      g.total_amount += e.total_amount;
      g.lines.push(e);
    }
    return Array.from(map.values());
  }, [expenses, supplierLookup]);

  const sorted = useMemo(() => {
    const copy = [...groups];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'expense_date':    cmp = a.expense_date.localeCompare(b.expense_date); break;
        case 'supplier':        cmp = a.supplier_name.localeCompare(b.supplier_name); break;
        case 'invoice_number':  cmp = a.invoice_number.localeCompare(b.invoice_number); break;
        case 'net_amount':      cmp = a.net_amount - b.net_amount; break;
        case 'vat_amount':      cmp = a.vat_amount - b.vat_amount; break;
        case 'total_amount':    cmp = a.total_amount - b.total_amount; break;
        case 'payment_method':  cmp = a.payment_method.localeCompare(b.payment_method); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [groups, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => setPage(0), [expenses]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function toggleExpand(key: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-gray-300 ml-0.5">↕</span>;
    return <span className="text-primary ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const totalAmount = groups.reduce((s, g) => s + g.total_amount, 0);

  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-400 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-navy">Expense Details</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {groups.length} invoices &middot; {expenses.length} line items &middot; Total: {formatCurrencyFull(totalAmount)}
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">No expenses found for this period</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 pr-2 w-6" />
                  {([
                    ['expense_date',   'Date'],
                    ['supplier',       'Supplier'],
                    ['invoice_number', 'Invoice #'],
                    ['net_amount',     'Net'],
                    ['vat_amount',     'VAT'],
                    ['total_amount',   'Total'],
                    ['payment_method', 'Payment'],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors whitespace-nowrap select-none"
                    >
                      {label}<SortIcon field={field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((group) => {
                  const isOpen = expanded.has(group.key);
                  return (
                    <Fragment key={group.key}>
                      {/* Invoice row */}
                      <tr
                        onClick={() => toggleExpand(group.key)}
                        className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 pr-2 text-gray-400 text-xs w-6">
                          <span className="inline-block transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                        </td>
                        <td className="py-3 pr-3 text-xs text-gray-600 whitespace-nowrap">
                          {formatDate(group.expense_date)}
                        </td>
                        <td className="py-3 pr-3 text-xs font-semibold text-navy max-w-[140px] truncate">
                          {group.supplier_name}
                        </td>
                        <td className="py-3 pr-3 text-xs text-gray-500 whitespace-nowrap">
                          {group.invoice_number}
                        </td>
                        <td className="py-3 pr-3 text-xs text-gray-600 text-right whitespace-nowrap">
                          {formatCurrencyFull(group.net_amount)}
                        </td>
                        <td className="py-3 pr-3 text-xs text-gray-400 text-right whitespace-nowrap">
                          {formatCurrencyFull(group.vat_amount)}
                        </td>
                        <td className="py-3 pr-3 text-xs font-bold text-navy text-right whitespace-nowrap">
                          {formatCurrencyFull(group.total_amount)}
                        </td>
                        <td className="py-3 pr-3 text-xs text-gray-500 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                            {group.payment_method}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded line items */}
                      {isOpen && group.lines.map((line, idx) => (
                        <tr
                          key={line.expense_id}
                          className="bg-blue-50/40 border-b border-blue-50"
                        >
                          <td className="py-2 pr-2" />
                          <td className="py-2 pr-3 text-[10px] text-gray-400 pl-4">
                            {idx + 1}.
                          </td>
                          <td className="py-2 pr-3 text-[10px] text-gray-500 pl-2 max-w-[140px] truncate" colSpan={2}>
                            {line.description}
                            {line.quantity ? (
                              <span className="ml-1 text-gray-400">×{line.quantity}</span>
                            ) : null}
                          </td>
                          <td className="py-2 pr-3 text-[10px] text-gray-400 text-right whitespace-nowrap">
                            {formatCurrencyFull(line.net_amount)}
                          </td>
                          <td className="py-2 pr-3 text-[10px] text-gray-400 text-right whitespace-nowrap">
                            {formatCurrencyFull(line.vat_amount)}
                          </td>
                          <td className="py-2 pr-3 text-[10px] text-gray-500 text-right whitespace-nowrap">
                            {formatCurrencyFull(line.total_amount)}
                          </td>
                          <td className="py-2 pr-3 text-[10px]">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-500">
                              {line.category || 'General'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Page {page + 1} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page < 3 ? i : page - 2 + i;
                  if (p >= totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >{p + 1}</button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
