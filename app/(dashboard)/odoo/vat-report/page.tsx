'use client';

import { useState, useEffect } from 'react';
import {
  fetchVATSnapshotYears,
  fetchVATSnapshot,
  type VATSnapshotRow,
} from '@/lib/supabase';
import KPICard, { KPICardSkeleton } from '@/components/KPICard';
import { formatCurrencyFull } from '@/lib/utils';

// ── Format helpers ──

function fmtNum(val: number | null): string {
  if (val === null || val === undefined) return '—';
  return formatCurrencyFull(val);
}

// ── Section labels ──

const SECTION_LABELS: Record<string, string> = {
  OUTPUT: 'OUTPUT',
  INPUT: 'INPUT — Imports and Purchases',
  VAT_ACCOUNT: 'VAT ACCOUNT',
};

// ── VAT Section component ──

function VATSection({
  sectionKey,
  rows,
  expanded,
  onToggle,
  delay = '',
}: {
  sectionKey: string;
  rows: VATSnapshotRow[];
  expanded: boolean;
  onToggle: () => void;
  delay?: string;
}) {
  return (
    <div
      className={`animate-fade-in-up opacity-0 ${delay} bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-bold text-navy">
            {SECTION_LABELS[sectionKey] || sectionKey}
          </h3>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-200 mb-2">
            <div className="col-span-6 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Description
            </div>
            <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-right">
              Value
            </div>
            <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 text-right">
              VAT
            </div>
          </div>

          {rows.map((row) => {
            const isTotal = row.level === 'total';
            const isItem = row.level === 'item';
            const isSubitem = row.level === 'subitem';

            return (
              <div
                key={row.row_order}
                className={`grid grid-cols-12 gap-2 py-1.5 ${
                  isTotal
                    ? 'border-t border-gray-200 mt-1 pt-2 font-bold'
                    : 'border-b border-gray-50'
                }`}
              >
                <div
                  className={`col-span-6 text-xs ${
                    isTotal
                      ? 'text-navy font-bold'
                      : isItem
                      ? 'text-gray-700 font-medium'
                      : 'text-gray-500 pl-4'
                  }`}
                >
                  {row.line_number && (
                    <span className="text-gray-400 mr-1">{row.line_number}</span>
                  )}
                  {row.name}
                </div>
                <div
                  className={`col-span-3 text-xs text-right ${
                    isTotal ? 'text-navy font-bold' : isSubitem ? 'text-gray-600' : 'text-navy'
                  }`}
                >
                  {row.net_value !== null ? fmtNum(row.net_value) : ''}
                </div>
                <div
                  className={`col-span-3 text-xs text-right ${
                    isTotal ? 'text-navy font-bold' : isSubitem ? 'text-gray-600' : 'text-navy'
                  }`}
                >
                  {row.vat_value !== null ? fmtNum(row.vat_value) : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ──

export default function VATReportPage() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [rows, setRows] = useState<VATSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    OUTPUT: true,
    INPUT: true,
    VAT_ACCOUNT: true,
  });

  // Load available years
  useEffect(() => {
    fetchVATSnapshotYears()
      .then((yrs) => {
        setYears(yrs);
        if (yrs.length > 0) setSelectedYear(yrs[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Load snapshot when year changes
  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    fetchVATSnapshot(selectedYear)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  // Derive section rows
  const sectionOrder = ['OUTPUT', 'INPUT', 'VAT_ACCOUNT'] as const;
  const sectionRows: Record<string, VATSnapshotRow[]> = {};
  for (const sec of sectionOrder) {
    sectionRows[sec] = rows.filter(
      (r) => r.parent_section === sec && r.level !== 'section'
    );
  }

  // Key totals for KPI cards
  const outputTotal = rows.find((r) => r.line_number === '5.');
  const inputTotal = rows.find((r) => r.line_number === '9.');
  const vatPayable = rows.find((r) => r.line_number === '19.');

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {/* Header */}
      <div className="animate-fade-in-up opacity-0 flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)',
          }}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy">VAT3 Tax Report</h1>
          <p className="text-xs text-gray-400">
            Odoo snapshot — Output VAT, Input VAT &amp; VAT Account
          </p>
        </div>
      </div>

      {/* Year selector */}
      <div className="animate-fade-in-up opacity-0 delay-100 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Year:</label>
          {years.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {years.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    selectedYear === yr
                      ? 'bg-navy text-white border-navy'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : (
            !loading && (
              <span className="text-xs text-gray-400">No snapshots available</span>
            )
          )}
          {selectedYear > 0 && (
            <span className="ml-auto text-[11px] text-gray-400">
              Data sourced directly from Odoo
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-sm text-red-700">
          Failed to load VAT report: {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
      )}

      {/* Content */}
      {!loading && rows.length > 0 && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            <KPICard
              title="Output VAT"
              value={fmtNum(outputTotal?.vat_value ?? null)}
              subtitle={`On ${fmtNum(outputTotal?.net_value ?? null)} taxable supplies`}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
              delay="delay-200"
            />
            <KPICard
              title="Input VAT"
              value={fmtNum(inputTotal?.vat_value ?? null)}
              subtitle={`On ${fmtNum(inputTotal?.net_value ?? null)} purchases`}
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              }
              gradient="linear-gradient(135deg, #4FD1C5 0%, #68D5C8 100%)"
              delay="delay-300"
            />
            <KPICard
              title="VAT Payable"
              value={fmtNum(vatPayable?.vat_value ?? null)}
              subtitle="Total due and payable"
              icon={
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              gradient={
                (vatPayable?.vat_value ?? 0) > 0
                  ? 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)'
                  : 'linear-gradient(135deg, #48BB78 0%, #68D391 100%)'
              }
              delay="delay-400"
            />
          </div>

          {/* Sections */}
          <div className="space-y-4 mb-6">
            {sectionOrder.map((sec, i) => (
              <VATSection
                key={sec}
                sectionKey={sec}
                rows={sectionRows[sec] || []}
                expanded={expanded[sec] ?? true}
                onToggle={() => toggle(sec)}
                delay={`delay-${300 + i * 100}`}
              />
            ))}
          </div>

          {/* Summary bar */}
          <div className="animate-fade-in-up opacity-0 delay-700 bg-gradient-to-r from-purple-50 to-teal-50 rounded-2xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Output VAT (line 5)</p>
                <p className="text-lg font-bold text-navy">{fmtNum(outputTotal?.vat_value ?? null)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Input VAT Credit (line 10)</p>
                <p className="text-lg font-bold text-teal-600">
                  − {fmtNum(inputTotal?.vat_value ?? null)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Net VAT Payable (line 19)</p>
                <p className="text-lg font-bold text-accent-red">{fmtNum(vatPayable?.vat_value ?? null)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-10 text-center">
          <p className="text-gray-400 text-sm">
            No VAT report snapshots found.
          </p>
          <p className="text-gray-300 text-xs mt-2">
            Export a VAT3 Tax Report from Odoo as XLSX, then run:
          </p>
          <p className="text-gray-400 text-xs mt-1 font-mono">
            python scripts/import_vat_report.py
          </p>
        </div>
      )}
    </>
  );
}
