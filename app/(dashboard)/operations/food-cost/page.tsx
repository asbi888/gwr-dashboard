'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import DailyFoodCostTable from '@/components/DailyFoodCostTable';
import IngredientExpenseTable from '@/components/IngredientExpenseTable';
import { computeDailyFoodCosts, getIngredientExpenses } from '@/lib/food-cost-processing';
import {
  formatCurrencyFull,
  formatCurrencyDecimal,
  formatTimeAgo,
  resolvePresetToRange,
  type DatePreset,
} from '@/lib/utils';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

const KPI_CONFIG = [
  { key: 'poulet' as const, label: 'Avg Cost/kg Poulet', color: 'from-amber-400 to-amber-500' },
  { key: 'poisson' as const, label: 'Avg Cost/kg Poisson', color: 'from-blue-400 to-blue-500' },
  { key: 'langoustes' as const, label: 'Avg Cost/kg Langoustes', color: 'from-rose-400 to-rose-500' },
];

export default function FoodCostPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('all_time');
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });

  const hasActiveFilters = datePreset !== 'all_time';

  return (
    <PageShell
      title="Operations - Food Cost"
      subtitle="Daily food costs based on usage and average purchase prices"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        // Apply date filter
        const resolved = resolvePresetToRange(datePreset, dateRange);

        let filteredExpenses = data.expenses;
        let filteredFoodUsage = data.foodUsage;

        if (resolved.from) {
          filteredExpenses = filteredExpenses.filter((e) => e.expense_date >= resolved.from!);
          filteredFoodUsage = filteredFoodUsage.filter((f) => f.usage_date >= resolved.from!);
        }
        if (resolved.to) {
          filteredExpenses = filteredExpenses.filter((e) => e.expense_date <= resolved.to!);
          filteredFoodUsage = filteredFoodUsage.filter((f) => f.usage_date <= resolved.to!);
        }

        const { rows, avgCostPerKg, totals, unweightedCosts } = computeDailyFoodCosts(filteredExpenses, filteredFoodUsage);
        const ingredientExpenses = getIngredientExpenses(filteredExpenses);

        return (
          <>
            {/* Period Filter Bar */}
            <div className="animate-fade-in-up opacity-0 delay-100 mb-6">
              <div className="bg-white rounded-2xl px-5 py-4 shadow-lg shadow-gray-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Period Filter */}
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

                  {/* Clear + Live status */}
                  <div className="flex items-center gap-3 lg:ml-auto">
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setDatePreset('all_time'); setDateRange({ from: null, to: null }); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-accent-red hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                      </button>
                    )}

                    {lastRefreshed && (
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        Updated {formatTimeAgo(lastRefreshed)}
                      </span>
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
              {KPI_CONFIG.map((kpi, i) => (
                <div
                  key={kpi.key}
                  className={`animate-fade-in-up opacity-0 delay-${(i + 2) * 100} bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {avgCostPerKg[kpi.key] > 0 ? formatCurrencyDecimal(avgCostPerKg[kpi.key]) : '—'}
                  </p>
                </div>
              ))}

              {/* Total Food Cost Card */}
              <div className="animate-fade-in-up opacity-0 delay-500 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B61FF] to-[#4FD1C5] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Food Cost</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {totals.grand > 0 ? formatCurrencyFull(Math.round(totals.grand)) : '—'}
                </p>
                {unweightedCosts.grand > 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Incl. {formatCurrencyFull(Math.round(unweightedCosts.grand))} without kg data
                  </p>
                )}
              </div>
            </div>

            {/* Daily Food Cost Table */}
            <div className="animate-fade-in-up opacity-0 delay-300 mb-6">
              <DailyFoodCostTable rows={rows} totals={totals} />
            </div>

            {/* Ingredient Expenses Table */}
            <div className="animate-fade-in-up opacity-0 delay-400">
              <IngredientExpenseTable rows={ingredientExpenses} />
            </div>
          </>
        );
      }}
    </PageShell>
  );
}
