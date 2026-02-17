'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import InventoryAlertCard from '@/components/InventoryAlertCard';
import FoodUsageChart from '@/components/FoodUsageChart';
import DrinksChart from '@/components/DrinksChart';
import InventoryTable from '@/components/InventoryTable';
import Modal from '@/components/ui/Modal';
import FoodUsageForm from '@/components/forms/FoodUsageForm';
import DrinksUsageForm from '@/components/forms/DrinksUsageForm';
import {
  computeInventory,
  buildFoodPurchaseVsUsage,
  buildDrinksSummary,
} from '@/lib/processing';
import { formatTimeAgo, resolvePresetToRange, type DatePreset } from '@/lib/utils';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

export default function OperationsInventoryPage() {
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showDrinksModal, setShowDrinksModal] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('all_time');
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({ from: null, to: null });

  const hasActiveFilters = datePreset !== 'all_time';

  return (
    <PageShell
      title="Operations - Inventory"
      subtitle="Food &amp; beverage inventory status and usage analytics"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      }
    >
      {(data, lastRefreshed) => {
        // Apply date filter to all data sources
        const resolved = resolvePresetToRange(datePreset, dateRange);

        let filteredExpenses = data.expenses;
        let filteredFoodUsage = data.foodUsage;
        let filteredDrinksUsage = data.drinksUsage;

        if (resolved.from) {
          filteredExpenses = filteredExpenses.filter((e) => e.expense_date >= resolved.from!);
          filteredFoodUsage = filteredFoodUsage.filter((f) => f.usage_date >= resolved.from!);
          filteredDrinksUsage = filteredDrinksUsage.filter((d) => d.usage_date >= resolved.from!);
        }
        if (resolved.to) {
          filteredExpenses = filteredExpenses.filter((e) => e.expense_date <= resolved.to!);
          filteredFoodUsage = filteredFoodUsage.filter((f) => f.usage_date <= resolved.to!);
          filteredDrinksUsage = filteredDrinksUsage.filter((d) => d.usage_date <= resolved.to!);
        }

        const inventory = computeInventory(filteredExpenses, filteredFoodUsage);
        const foodChart = buildFoodPurchaseVsUsage(filteredExpenses, filteredFoodUsage);
        const drinksSummary = buildDrinksSummary(filteredDrinksUsage);

        const criticalCount = inventory.filter((i) => i.status === 'red').length;

        return (
          <>
            {/* Status summary bar with period filter */}
            <div className="animate-fade-in-up opacity-0 delay-100 mb-6">
              <div className="bg-white rounded-2xl px-5 py-4 shadow-lg shadow-gray-200/50">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Alert indicator */}
                  <div className="flex items-center gap-2">
                    {criticalCount > 0 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                        <span className="text-xs font-semibold text-accent-red">
                          {criticalCount} critical alert{criticalCount > 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-semibold text-success">All stock levels healthy</span>
                      </>
                    )}
                  </div>

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

                  {/* Actions + Clear + Live */}
                  <div className="flex items-center gap-3 lg:ml-auto">
                    <button
                      onClick={() => setShowFoodModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-medium hover:bg-primary-dark transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Log Food Usage
                    </button>
                    <button
                      onClick={() => setShowDrinksModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-white text-[10px] font-medium hover:opacity-90 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Log Drinks
                    </button>

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

            {/* Inventory Alert Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              {inventory.map((item, i) => (
                <InventoryAlertCard
                  key={item.productKey}
                  item={item}
                  delay={`delay-${(i + 1) * 100}`}
                />
              ))}
            </div>

            {/* Charts: Food Purchase vs Usage + Drinks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="animate-fade-in-up opacity-0 delay-300">
                <FoodUsageChart data={foodChart} />
              </div>
              <div className="animate-fade-in-up opacity-0 delay-400">
                <DrinksChart data={drinksSummary} />
              </div>
            </div>

            {/* Full Inventory Table */}
            <div className="animate-fade-in-up opacity-0 delay-500">
              <InventoryTable data={inventory} />
            </div>

            {/* Log Food Usage Modal */}
            <Modal open={showFoodModal} onClose={() => setShowFoodModal(false)} title="Log Food Usage">
              <FoodUsageForm
                onSave={() => setShowFoodModal(false)}
                onCancel={() => setShowFoodModal(false)}
              />
            </Modal>

            {/* Log Drinks Usage Modal */}
            <Modal open={showDrinksModal} onClose={() => setShowDrinksModal(false)} title="Log Drinks Usage">
              <DrinksUsageForm
                onSave={() => setShowDrinksModal(false)}
                onCancel={() => setShowDrinksModal(false)}
              />
            </Modal>
          </>
        );
      }}
    </PageShell>
  );
}
