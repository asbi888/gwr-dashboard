'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Expense, Supplier } from '@/lib/supabase';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

interface ExpenseDetailTableProps {
  expenses: Expense[];
  suppliers: Supplier[];
}

type SortField = 'expense_date' | 'supplier' | 'description' | 'category' | 'net_amount' | 'vat_amount' | 'total_amount' | 'payment_method';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;

export default function ExpenseDetailTable({ expenses, suppliers }: ExpenseDetailTableProps) {
  const [sortField, setSortField] = useState<SortField>('expense_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  // Build supplier lookup
  const supplierLookup = useMemo(() => {
    const map: Record<number, string> = {};
    suppliers.forEach((s) => {
      map[s.supplier_key] = s.standard_name;
    });
    return map;
  }, [suppliers]);

  // Sorted expenses
  const sorted = useMemo(() => {
    const copy = [...expenses];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'expense_date':
          cmp = a.expense_date.localeCompare(b.expense_date);
          break;
        case 'supplier':
          cmp = (supplierLookup[a.supplier_key] || '').localeCompare(supplierLookup[b.supplier_key] || '');
          break;
        case 'description':
          cmp = (a.description || '').localeCompare(b.description || '');
          break;
        case 'category':
          cmp = (a.category || '').localeCompare(b.category || '');
          break;
        case 'net_amount':
          cmp = a.net_amount - b.net_amount;
          break;
        case 'vat_amount':
          cmp = a.vat_amount - b.vat_amount;
          break;
        case 'total_amount':
          cmp = a.total_amount - b.total_amount;
          break;
        case 'payment_method':
          cmp = (a.payment_method || '').localeCompare(b.payment_method || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [expenses, sortField, sortDir, supplierLookup]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when data changes
  useEffect(() => setPage(0), [expenses]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="text-gray-300 ml-0.5">&udarr;</span>;
    return (
      <span className="text-primary ml-0.5">
        {sortDir === 'asc' ? '\u2191' : '\u2193'}
      </span>
    );
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.total_amount, 0);

  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-400 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-navy">Expense Details</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {expenses.length} transactions &middot; Total: {formatCurrencyFull(totalAmount)}
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">No expenses found for this period</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {([
                    ['expense_date', 'Date'],
                    ['supplier', 'Supplier'],
                    ['description', 'Description'],
                    ['category', 'Category'],
                    ['net_amount', 'Net'],
                    ['vat_amount', 'VAT'],
                    ['total_amount', 'Total'],
                    ['payment_method', 'Payment'],
                  ] as [SortField, string][]).map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
                      className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors whitespace-nowrap select-none"
                    >
                      {label}
                      <SortIcon field={field} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((expense) => (
                  <tr
                    key={expense.expense_id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 pr-3 text-xs text-gray-600 whitespace-nowrap">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="py-3 pr-3 text-xs font-medium text-navy max-w-[140px] truncate">
                      {supplierLookup[expense.supplier_key] || `#${expense.supplier_key}`}
                    </td>
                    <td className="py-3 pr-3 text-xs text-gray-600 max-w-[160px] truncate">
                      {expense.description}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        {expense.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-gray-600 text-right whitespace-nowrap">
                      {formatCurrencyFull(expense.net_amount)}
                    </td>
                    <td className="py-3 pr-3 text-xs text-gray-400 text-right whitespace-nowrap">
                      {formatCurrencyFull(expense.vat_amount)}
                    </td>
                    <td className="py-3 pr-3 text-xs font-semibold text-navy text-right whitespace-nowrap">
                      {formatCurrencyFull(expense.total_amount)}
                    </td>
                    <td className="py-3 text-xs text-gray-500 whitespace-nowrap">
                      {expense.payment_method || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page < 3 ? i : page - 2 + i;
                  if (p >= totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        page === p
                          ? 'bg-primary text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {p + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
