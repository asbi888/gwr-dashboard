'use client';

import { useState } from 'react';
import type { DailyDrinksCostRow } from '@/lib/drinks-cost-processing';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

type SortField = 'date' | 'coca_cola_cost' | 'sprite_cost' | 'beer_cost' | 'rhum_cost' | 'rose_cost' | 'blanc_cost' | 'total_cost';
type SortDir = 'asc' | 'desc';

const COLUMNS: { field: SortField; label: string; btlField?: keyof DailyDrinksCostRow }[] = [
  { field: 'coca_cola_cost', label: 'Coca-Cola', btlField: 'coca_cola_btl' },
  { field: 'sprite_cost', label: 'Sprite', btlField: 'sprite_btl' },
  { field: 'beer_cost', label: 'Beer', btlField: 'beer_btl' },
  { field: 'rhum_cost', label: 'Rhum', btlField: 'rhum_btl' },
  { field: 'rose_cost', label: 'Rosé', btlField: 'rose_btl' },
  { field: 'blanc_cost', label: 'Blanc', btlField: 'blanc_btl' },
];

interface Props {
  rows: DailyDrinksCostRow[];
  totals: {
    coca_cola: number; sprite: number; beer: number;
    rhum: number; rose: number; blanc: number;
    grand: number;
  };
}

const TOTAL_KEYS: Record<string, keyof Props['totals']> = {
  coca_cola_cost: 'coca_cola',
  sprite_cost: 'sprite',
  beer_cost: 'beer',
  rhum_cost: 'rhum',
  rose_cost: 'rose',
  blanc_cost: 'blanc',
};

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

  const thClass = 'px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:text-primary transition-colors';
  const tdClass = 'px-2 py-2.5 text-sm';

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Daily Drinks Cost</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Usage (bottles) x Standard cost per bottle</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className={thClass} onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              {COLUMNS.map((col) => (
                <th key={col.field} className={`${thClass} text-right`} onClick={() => toggleSort(col.field)}>
                  {col.label} <SortIcon field={col.field} />
                </th>
              ))}
              <th className={`${thClass} text-right`} onClick={() => toggleSort('total_cost')}>
                Total <SortIcon field="total_cost" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-gray-400">
                  No drinks usage data for this period
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.date} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className={`${tdClass} font-medium text-gray-700`}>{formatDate(r.date)}</td>
                  {COLUMNS.map((col) => {
                    const btl = col.btlField ? (r[col.btlField] as number) : 0;
                    const cost = r[col.field] as number;
                    return (
                      <td key={col.field} className={`${tdClass} text-right`}>
                        {btl > 0 ? (
                          <>
                            <span className="text-gray-700">{formatCurrencyFull(Math.round(cost))}</span>
                            <span className="text-[10px] text-gray-400 ml-1">({btl})</span>
                          </>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className={`${tdClass} text-right font-semibold text-gray-800`}>{formatCurrencyFull(Math.round(r.total_cost))}</td>
                </tr>
              ))
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className={`${tdClass} font-bold text-gray-700`}>Total</td>
                {COLUMNS.map((col) => {
                  const totalKey = TOTAL_KEYS[col.field];
                  return (
                    <td key={col.field} className={`${tdClass} text-right font-bold text-gray-800`}>
                      {formatCurrencyFull(Math.round(totals[totalKey]))}
                    </td>
                  );
                })}
                <td className={`${tdClass} text-right font-bold text-gray-900`}>{formatCurrencyFull(Math.round(totals.grand))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
