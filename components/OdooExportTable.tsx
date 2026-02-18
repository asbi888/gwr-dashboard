'use client';

import { useState } from 'react';
import type { OdooExportRow } from '@/lib/odoo-export-processing';
import { ACCOUNT_LABELS } from '@/lib/odoo-export-processing';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

type SortField = 'date' | 'supplier' | 'invoice_number' | 'description' | 'kg' | 'amount' | 'vat_amount' | 'account';
type SortDir = 'asc' | 'desc';

interface Props {
  rows: OdooExportRow[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}

export default function OdooExportTable({ rows, selectedIds, onToggle, onToggleAll }: Props) {
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
    switch (sortField) {
      case 'date': return mul * a.date.localeCompare(b.date);
      case 'supplier': return mul * a.supplier.localeCompare(b.supplier);
      case 'invoice_number': return mul * a.invoice_number.localeCompare(b.invoice_number);
      case 'description': return mul * a.description.localeCompare(b.description);
      case 'kg': return mul * ((a.kg || 0) - (b.kg || 0));
      case 'amount': return mul * (a.amount - b.amount);
      case 'vat_amount': return mul * (a.vat_amount - b.vat_amount);
      case 'account': return mul * a.account.localeCompare(b.account);
      default: return 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-0.5">{'\u2195'}</span>;
    return <span className="text-primary ml-0.5">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  const thClass = 'px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 cursor-pointer select-none hover:text-primary transition-colors';
  const tdClass = 'px-2 py-2.5 text-sm';

  const totalAmount = rows.filter((r) => selectedIds.has(r.expense_id)).reduce((s, r) => s + r.amount, 0);
  const totalVat = rows.filter((r) => selectedIds.has(r.expense_id)).reduce((s, r) => s + r.vat_amount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Vendor Bills Preview</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Select rows to include in the Odoo CSV export &middot; {selectedIds.size} of {rows.length} selected
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-2 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary/30"
                />
              </th>
              <th className={thClass} onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              <th className={thClass} onClick={() => toggleSort('supplier')}>
                Supplier <SortIcon field="supplier" />
              </th>
              <th className={thClass} onClick={() => toggleSort('invoice_number')}>
                Invoice # <SortIcon field="invoice_number" />
              </th>
              <th className={thClass} onClick={() => toggleSort('description')}>
                Description <SortIcon field="description" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('kg')}>
                Kg <SortIcon field="kg" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('amount')}>
                Amount (Rs) <SortIcon field="amount" />
              </th>
              <th className={`${thClass} text-right`} onClick={() => toggleSort('vat_amount')}>
                VAT <SortIcon field="vat_amount" />
              </th>
              <th className={thClass} onClick={() => toggleSort('account')}>
                Account <SortIcon field="account" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-sm text-gray-400">
                  No expenses for this period
                </td>
              </tr>
            ) : (
              sorted.map((r) => {
                const isSelected = selectedIds.has(r.expense_id);
                return (
                  <tr
                    key={r.expense_id}
                    className={`border-b border-gray-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-gray-50/50'
                    }`}
                    onClick={() => onToggle(r.expense_id)}
                  >
                    <td className="px-2 py-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(r.expense_id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-primary focus:ring-primary/30"
                      />
                    </td>
                    <td className={`${tdClass} text-gray-600 whitespace-nowrap`}>{formatDate(r.date)}</td>
                    <td className={`${tdClass} font-medium text-gray-700`}>
                      {r.supplier}
                      {!r.isMapped && (
                        <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-600">
                          Unmapped
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} text-gray-600`}>{r.invoice_number || <span className="text-gray-300">&mdash;</span>}</td>
                    <td className={`${tdClass} text-gray-700`}>{r.description}</td>
                    <td className={`${tdClass} text-right text-gray-600`}>
                      {r.kg != null ? r.kg.toFixed(1) : <span className="text-gray-300">&mdash;</span>}
                    </td>
                    <td className={`${tdClass} text-right font-medium text-gray-700`}>{formatCurrencyFull(Math.round(r.amount))}</td>
                    <td className={`${tdClass} text-right text-gray-600`}>
                      {r.vat_amount > 0 ? formatCurrencyFull(Math.round(r.vat_amount)) : <span className="text-gray-300">&mdash;</span>}
                    </td>
                    <td className={tdClass}>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.account === '630000' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.account}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-1 hidden xl:inline">
                        {ACCOUNT_LABELS[r.account] || ''}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className={`${tdClass}`} />
                <td className={`${tdClass} font-bold text-gray-700`} colSpan={5}>
                  Selected Total ({selectedIds.size} rows)
                </td>
                <td className={`${tdClass} text-right font-bold text-gray-900`}>{formatCurrencyFull(Math.round(totalAmount))}</td>
                <td className={`${tdClass} text-right font-bold text-gray-900`}>{totalVat > 0 ? formatCurrencyFull(Math.round(totalVat)) : ''}</td>
                <td className={tdClass} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
