'use client';

import { useState } from 'react';
import type { DrinksPurchaseRow } from '@/lib/drinks-cost-processing';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

type SortField = 'expense_date' | 'description' | 'supplier_name' | 'quantity' | 'net_amount';
type SortDir = 'asc' | 'desc';

const CATEGORY_BADGE: Record<string, { label: string; color: string }> = {
  beer_soft: { label: 'Beer & Soft', color: 'bg-green-100 text-green-700' },
  wine_rhum: { label: 'Wine & Rhum', color: 'bg-purple-100 text-purple-700' },
};

interface Props {
  rows: DrinksPurchaseRow[];
}

export default function DrinksPurchaseTable({ rows }: Props) {
  const [sortField, setSortField] = useState<SortField>('expense_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...rows].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'expense_date') return mul * a.expense_date.localeCompare(b.expense_date);
    if (sortField === 'description') return mul * a.description.localeCompare(b.description);
    if (sortField === 'supplier_name') return mul * a.supplier_name.localeCompare(b.supplier_name);
    if (sortField === 'quantity') return mul * ((a.quantity || 0) - (b.quantity || 0));
    if (sortField === 'net_amount') return mul * (a.net_amount - b.net_amount);
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-0.5">{'\u2195'}</span>;
    return <span className="text-primary ml-0.5">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  const thClass = 'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:text-primary transition-colors';
  const tdClass = 'px-3 py-2.5 text-sm';

  const totalAmount = rows.reduce((sum, r) => sum + r.net_amount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Drinks Purchases</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Beverage expense details</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={thClass} onClick={() => toggleSort('expense_date')}>
                Date <SortIcon field="expense_date" />
              </th>
              <th className={thClass} onClick={() => toggleSort('description')}>
                Description <SortIcon field="description" />
              </th>
              <th className={thClass} onClick={() => toggleSort('supplier_name')}>
                Supplier <SortIcon field="supplier_name" />
              </th>
              <th className={thClass}>Category</th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('quantity')}>
                Qty <SortIcon field="quantity" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('net_amount')}>
                Net Amount <SortIcon field="net_amount" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-400">
                  No drinks purchases for this period
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const badge = CATEGORY_BADGE[r.drinks_category];
                return (
                  <tr key={r.expense_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className={`${tdClass} text-gray-600`}>{formatDate(r.expense_date)}</td>
                    <td className={`${tdClass} font-medium text-gray-700`}>{r.description}</td>
                    <td className={`${tdClass} text-gray-600`}>{r.supplier_name}</td>
                    <td className={tdClass}>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className={`${tdClass} text-right text-gray-600`}>
                      {r.quantity != null && r.quantity > 0
                        ? `${r.quantity} ${r.unit_of_measure || ''}`
                        : <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-600">No qty</span>
                      }
                    </td>
                    <td className={`${tdClass} text-right font-medium text-gray-700`}>{formatCurrencyFull(Math.round(r.net_amount))}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className={`${tdClass} font-bold text-gray-700`} colSpan={5}>Total</td>
                <td className={`${tdClass} text-right font-bold text-gray-900`}>{formatCurrencyFull(Math.round(totalAmount))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
