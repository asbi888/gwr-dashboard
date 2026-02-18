'use client';

import { useState } from 'react';
import type { DailyFoodCostRow } from '@/lib/food-cost-processing';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

type SortField = 'date' | 'poulet_kg' | 'poulet_cost' | 'poisson_kg' | 'poisson_cost' | 'langoustes_kg' | 'langoustes_cost' | 'total_cost';
type SortDir = 'asc' | 'desc';

interface Props {
  rows: DailyFoodCostRow[];
  totals: { poulet: number; poisson: number; langoustes: number; grand: number };
}

export default function DailyFoodCostTable({ rows, totals }: Props) {
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
        <h3 className="text-sm font-bold text-gray-800">Daily Food Cost</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Usage (kg) x Average cost per kg</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={thClass} onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('poulet_kg')}>
                Poulet (kg) <SortIcon field="poulet_kg" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('poulet_cost')}>
                Poulet (Rs) <SortIcon field="poulet_cost" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('poisson_kg')}>
                Poisson (kg) <SortIcon field="poisson_kg" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('poisson_cost')}>
                Poisson (Rs) <SortIcon field="poisson_cost" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('langoustes_kg')}>
                Langoustes (kg) <SortIcon field="langoustes_kg" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('langoustes_cost')}>
                Langoustes (Rs) <SortIcon field="langoustes_cost" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('total_cost')}>
                Total (Rs) <SortIcon field="total_cost" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">
                  No food usage data for this period
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.date} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className={`${tdClass} font-medium text-gray-700`}>{formatDate(r.date)}</td>
                  <td className={`${tdClass} text-right text-gray-600`}>{r.poulet_kg.toFixed(1)}</td>
                  <td className={`${tdClass} text-right text-gray-700`}>{formatCurrencyFull(Math.round(r.poulet_cost))}</td>
                  <td className={`${tdClass} text-right text-gray-600`}>{r.poisson_kg.toFixed(1)}</td>
                  <td className={`${tdClass} text-right text-gray-700`}>{formatCurrencyFull(Math.round(r.poisson_cost))}</td>
                  <td className={`${tdClass} text-right text-gray-600`}>{r.langoustes_kg.toFixed(1)}</td>
                  <td className={`${tdClass} text-right text-gray-700`}>{formatCurrencyFull(Math.round(r.langoustes_cost))}</td>
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
                <td className={`${tdClass} text-right font-bold text-gray-800`}>{formatCurrencyFull(Math.round(totals.poulet))}</td>
                <td className={`${tdClass} text-right`} />
                <td className={`${tdClass} text-right font-bold text-gray-800`}>{formatCurrencyFull(Math.round(totals.poisson))}</td>
                <td className={`${tdClass} text-right`} />
                <td className={`${tdClass} text-right font-bold text-gray-800`}>{formatCurrencyFull(Math.round(totals.langoustes))}</td>
                <td className={`${tdClass} text-right font-bold text-gray-900`}>{formatCurrencyFull(Math.round(totals.grand))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
