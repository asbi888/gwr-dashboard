'use client';

import { useState, useMemo } from 'react';
import type { Revenue, RevenueLine } from '@/lib/supabase';
import { formatCurrencyFull, formatDate } from '@/lib/utils';

interface ClientRevenueTableProps {
  clientName: string;
  revenue: Revenue[];
  revenueLines: RevenueLine[];
}

const PAGE_SIZE = 15;

export default function ClientRevenueTable({
  clientName,
  revenue,
  revenueLines,
}: ClientRevenueTableProps) {
  const [page, setPage] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Build line items lookup
  const linesByRevenue = useMemo(() => {
    const map: Record<string, RevenueLine[]> = {};
    revenueLines.forEach((line) => {
      if (!map[line.revenue_id]) map[line.revenue_id] = [];
      map[line.revenue_id].push(line);
    });
    return map;
  }, [revenueLines]);

  // Sorted orders
  const sorted = useMemo(() => {
    const copy = [...revenue];
    copy.sort((a, b) => {
      const cmp = a.revenue_date.localeCompare(b.revenue_date);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [revenue, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when data changes
  useMemo(() => setPage(0), [revenue]);

  // Totals
  const totalRevenue = revenue.reduce((sum, r) => {
    const lines = linesByRevenue[r.revenue_id] || [];
    return sum + lines.reduce((s, l) => s + l.line_total, 0);
  }, 0);
  const totalPax = revenue.reduce((sum, r) => sum + r.pax_count, 0);

  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-500 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-navy">Revenue: {clientName}</h3>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)' }}
            >
              {revenue.length} orders
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalPax} total pax &middot; Total: {formatCurrencyFull(totalRevenue)}
          </p>
        </div>
        <button
          onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Date {sortDir === 'desc' ? '\u2193' : '\u2191'}
        </button>
      </div>

      {revenue.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">No orders found for {clientName} in this period</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider w-6" />
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Pax
                  </th>
                  <th className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Menu Items
                  </th>
                  <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((order) => {
                  const lines = linesByRevenue[order.revenue_id] || [];
                  const orderTotal = lines.reduce((s, l) => s + l.line_total, 0);
                  const menuSummary = lines
                    .map((l) => `${l.menu_item} (${l.quantity})`)
                    .join(', ');
                  const isExpanded = expandedRow === order.revenue_id;

                  return (
                    <tr key={order.revenue_id} className="group">
                      <td colSpan={5} className="p-0">
                        {/* Main row */}
                        <div
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : order.revenue_id)
                          }
                          className="flex items-center py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        >
                          <div className="pr-3 w-6 flex items-center justify-center">
                            <svg
                              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                          <div className="pr-3 text-xs text-gray-600 whitespace-nowrap min-w-[90px]">
                            {formatDate(order.revenue_date)}
                          </div>
                          <div className="pr-3 text-xs text-gray-600 min-w-[40px]">
                            {order.pax_count}
                          </div>
                          <div className="pr-3 text-xs text-gray-500 flex-1 truncate">
                            {menuSummary || '—'}
                          </div>
                          <div className="text-xs font-semibold text-navy text-right whitespace-nowrap">
                            {formatCurrencyFull(orderTotal)}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && lines.length > 0 && (
                          <div className="bg-gray-50/50 border-b border-gray-100">
                            <div className="py-2 px-8">
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <th className="pb-1 text-[9px] font-semibold text-gray-400 uppercase text-left">
                                      Menu Item
                                    </th>
                                    <th className="pb-1 text-[9px] font-semibold text-gray-400 uppercase text-right">
                                      Qty
                                    </th>
                                    <th className="pb-1 text-[9px] font-semibold text-gray-400 uppercase text-right">
                                      Unit Price
                                    </th>
                                    <th className="pb-1 text-[9px] font-semibold text-gray-400 uppercase text-right">
                                      Line Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {lines.map((line) => (
                                    <tr key={line.line_id}>
                                      <td className="py-1 text-xs text-gray-600">
                                        {line.menu_item}
                                      </td>
                                      <td className="py-1 text-xs text-gray-600 text-right">
                                        {line.quantity}
                                      </td>
                                      <td className="py-1 text-xs text-gray-600 text-right">
                                        {formatCurrencyFull(line.unit_price)}
                                      </td>
                                      <td className="py-1 text-xs font-medium text-navy text-right">
                                        {formatCurrencyFull(line.line_total)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
