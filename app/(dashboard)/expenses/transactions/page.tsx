'use client';

import { useState, useRef, useEffect } from 'react';
import PageShell from '@/components/PageShell';
import KPICard from '@/components/KPICard';
import ExpenseDetailTable from '@/components/ExpenseDetailTable';
import { getUniqueSupplierNames } from '@/lib/processing';
import { formatCurrency, formatPercent, percentChange, resolvePresetToRange, type DatePreset } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';

export default function AllTransactionsPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('all_time');
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const DATE_PRESETS: { value: DatePreset; label: string }[] = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'all_time', label: 'All Time' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <PageShell
      title="All Transactions"
      subtitle="Complete expense transaction history"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        const resolved = resolvePresetToRange(datePreset, dateRange);

        // Filter expenses by date
        let filteredExpenses = data.expenses;
        if (resolved.from) filteredExpenses = filteredExpenses.filter((e) => e.expense_date >= resolved.from!);
        if (resolved.to) filteredExpenses = filteredExpenses.filter((e) => e.expense_date <= resolved.to!);

        // Supplier lookup and names
        const supplierLookup: Record<number, string> = {};
        data.suppliers.forEach((s) => { supplierLookup[s.supplier_key] = s.standard_name; });
        const supplierNames = getUniqueSupplierNames(filteredExpenses, data.suppliers);

        // Filter by supplier (use supplier_name field, fall back to supplier_key lookup)
        let displayedExpenses = filteredExpenses;
        if (selectedSupplier) {
          displayedExpenses = filteredExpenses.filter(
            (e) => (e.supplier_name?.trim() || supplierLookup[e.supplier_key]) === selectedSupplier
          );
        }

        // KPI stats based on displayed (filtered) expenses
        const totalExpenses = displayedExpenses.reduce((s, e) => s + e.total_amount, 0);
        const totalVat = displayedExpenses.reduce((s, e) => s + e.vat_amount, 0);
        const totalNet = displayedExpenses.reduce((s, e) => s + e.net_amount, 0);
        const avgPerTxn = displayedExpenses.length > 0 ? totalExpenses / displayedExpenses.length : 0;

        // Trend: current vs previous month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        let curMonthExp = 0, prevMonthExp = 0;
        displayedExpenses.forEach((e) => {
          const m = e.expense_date.substring(0, 7);
          if (m === currentMonth) curMonthExp += e.total_amount;
          if (m === prevMonthKey) prevMonthExp += e.total_amount;
        });
        const expTrend = percentChange(curMonthExp, prevMonthExp);

        const filteredSupplierNames = supplierNames.filter((n) =>
          n.toLowerCase().includes(supplierSearch.toLowerCase())
        );
        const hasActiveFilters = datePreset !== 'all_time' || selectedSupplier !== null;

        return (
          <>
            {/* Filter Bar with Supplier dropdown */}
            <div className="animate-fade-in-up opacity-0 delay-100 mb-6 relative z-20">
              <div className="bg-white rounded-2xl px-5 py-4 shadow-lg shadow-gray-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Date Presets */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Period</span>
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-0.5">
                      {DATE_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setDatePreset(preset.value);
                            if (preset.value !== 'custom') setDateRange({ from: null, to: null });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                            datePreset === preset.value
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-gray-500 hover:text-primary hover:bg-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Inputs */}
                  {datePreset === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateRange.from || ''}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value || null })}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="date"
                        value={dateRange.to || ''}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value || null })}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
                      />
                    </div>
                  )}

                  {/* Supplier Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all duration-200 ${
                        selectedSupplier
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 text-gray-500 hover:border-primary/30'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                      {selectedSupplier || 'All Suppliers'}
                      <svg className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {dropdownOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                        style={{ animation: 'dropdownIn 0.15s ease-out' }}
                      >
                        <div className="p-2 border-b border-gray-100">
                          <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs text-gray-700 placeholder-gray-400 outline-none focus:ring-1 focus:ring-primary/30"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          <button
                            onClick={() => { setSelectedSupplier(null); setDropdownOpen(false); setSupplierSearch(''); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              !selectedSupplier ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            All Suppliers
                          </button>
                          {filteredSupplierNames.map((name) => (
                            <button
                              key={name}
                              onClick={() => { setSelectedSupplier(name); setDropdownOpen(false); setSupplierSearch(''); }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                selectedSupplier === name ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clear + Live */}
                  <div className="flex items-center gap-3 lg:ml-auto">
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setDatePreset('all_time'); setDateRange({ from: null, to: null }); setSelectedSupplier(null); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-accent-red hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                      </button>
                    )}
                    {lastRefreshed && (
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">Updated {formatTimeAgo(lastRefreshed)}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] text-gray-400">Live</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <KPICard
                title="Total Expenses"
                value={formatCurrency(totalExpenses)}
                trend={{ value: formatPercent(expTrend), isPositive: expTrend <= 0 }}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
                gradient="linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)"
                subtitle="vs last month"
                delay="delay-100"
              />
              <KPICard
                title="Transactions"
                value={displayedExpenses.length.toString()}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                gradient="linear-gradient(135deg, #7B61FF 0%, #9F8FFF 100%)"
                subtitle="total count"
                delay="delay-200"
              />
              <KPICard
                title="Net Amount"
                value={formatCurrency(totalNet)}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                gradient="linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%)"
                subtitle={`VAT: ${formatCurrency(totalVat)}`}
                delay="delay-300"
              />
              <KPICard
                title="Avg per Transaction"
                value={formatCurrency(avgPerTxn)}
                icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
                gradient="linear-gradient(135deg, #FFB547 0%, #F6AD55 100%)"
                subtitle="average amount"
                delay="delay-400"
              />
            </div>

            {/* Full Expense Table (read-only — expenses managed via ETL pipeline) */}
            <div className="animate-fade-in-up opacity-0 delay-300">
              <ExpenseDetailTable
                expenses={displayedExpenses}
                suppliers={data.suppliers}
              />
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
