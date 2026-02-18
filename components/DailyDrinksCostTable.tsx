'use client';

import { useState } from 'react';
import type { DailyDrinksCostRow } from '@/lib/drinks-cost-processing';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

type SortField = 'date' | 'beer_soft_bottles' | 'beer_soft_cost' | 'wine_rhum_bottles' | 'wine_rhum_cost' | 'total_cost';
type SortDir = 'asc' | 'desc';

interface Props {
  rows: DailyDrinksCostRow[];
  totals: { beer_soft: number; wine_rhum: number; grand: number };
}

export default function DailyDrinksCostTable({ rows, totals }: Props) {
  const [sortField, setSortField] = useState<SortField>('date');
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
    if (sortField === 'date') return mul * a.date.localeCompare(b.date);
    return mul * ((a[sortField] as number) - (b[sortField] as number));
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-0.5">{'\u2195'}</span>;
    return <span className="text-primary ml-0.5">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  const thClass = 'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:text-primary transition-colors';
  const tdClass = 'px-3 py-2.5 text-sm';

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Daily Drinks Cost</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Usage (bottles) x Average cost per bottle</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={thClass} onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('beer_soft_bottles')}>
                Beer & Soft (btl) <SortIcon field="beer_soft_bottles" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('beer_soft_cost')}>
                Beer & Soft (Rs) <SortIcon field="beer_soft_cost" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('wine_rhum_bottles')}>
                Wine & Rhum (btl) <SortIcon field="wine_rhum_bottles" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('wine_rhum_cost')}>
                Wine & Rhum (Rs) <SortIcon field="wine_rhum_cost" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('total_cost')}>
                Total (Rs) <SortIcon field="total_cost" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-400">
                  No drinks usage data for this period
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.date} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className={`${tdClass} font-medium text-gray-700`}>{formatDate(r.date)}</td>
                  <td className={`${tdClass} text-right text-gray-600`}>{r.beer_soft_bottles}</td>
                  <td className={`${tdClass} text-right text-gray-700`}>{formatCurrencyFull(Math.round(r.beer_soft_cost))}</td>
                  <td className={`${tdClass} text-right text-gray-600`}>{r.wine_rhum_bottles}</td>
                  <td className={`${tdClass} text-right text-gray-700`}>{formatCurrencyFull(Math.round(r.wine_rhum_cost))}</td>
                  <td className={`${tdClass} text-right font-semibold text-gray-800`}>{formatCurrencyFull(Math.round(r.total_cost))}</td>
                </tr>
              ))
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className={`${tdClass} font-bold text-gray-700`}>Total</td>
                <td className={`${tdClass} text-right`} />
                <td className={`${tdClass} text-right font-bold text-gray-800`}>{formatCurrencyFull(Math.round(totals.beer_soft))}</td>
                <td className={`${tdClass} text-right`} />
                <td className={`${tdClass} text-right font-bold text-gray-800`}>{formatCurrencyFull(Math.round(totals.wine_rhum))}</td>
                <td className={`${tdClass} text-right font-bold text-gray-900`}>{formatCurrencyFull(Math.round(totals.grand))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
