'use client';

import type { InventoryItem } from '@/lib/processing';

interface InventoryTableProps {
  data: InventoryItem[];
}

const STATUS_STYLES = {
  green: { bg: '#F0FFF4', text: '#01B574', label: 'Healthy' },
  yellow: { bg: '#FFFAF0', text: '#DD6B20', label: 'Low Stock' },
  red: { bg: '#FFF5F5', text: '#E53E3E', label: 'Critical' },
};

const BAR_COLORS = {
  green: 'linear-gradient(90deg, #01B574, #38D9A9)',
  yellow: 'linear-gradient(90deg, #FFB547, #F6AD55)',
  red: 'linear-gradient(90deg, #FF6B6B, #FC8181)',
};

export default function InventoryTable({ data }: InventoryTableProps) {
  const maxPurchased = Math.max(...data.map((d) => d.purchased), 1);

  return (
    <div className="card-hover bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-navy">Inventory Status</h3>
        <p className="text-xs text-gray-400 mt-0.5">Food product stock levels</p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Purchased</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Used</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">On Hand</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Avg/Day</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Days Supply</th>
              <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const style = STATUS_STYLES[item.status];
              return (
                <tr key={item.productKey} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy">{item.product}</p>
                        {/* Progress bar showing on-hand vs purchased */}
                        <div className="mt-1 w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.max(0, Math.min(100, (item.purchased / maxPurchased) * 100))}%`,
                              background: BAR_COLORS[item.status],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-medium text-gray-700">{item.purchased.toFixed(1)} kg</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-medium text-gray-700">{item.used.toFixed(1)} kg</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`text-sm font-bold ${item.onHand < 0 ? 'text-accent-red' : 'text-navy'}`}>
                      {item.onHand.toFixed(1)} kg
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-medium text-gray-700">{item.avgDailyUse} kg</span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-bold text-navy">
                      {item.daysSupply > 900 ? '999+' : item.daysSupply}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      {style.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {data.map((item) => {
          const style = STATUS_STYLES[item.status];
          return (
            <div key={item.productKey} className="p-4 rounded-xl bg-gray-50/50 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-navy">{item.product}</p>
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {style.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-gray-400">Purchased</p>
                  <p className="text-xs font-semibold text-navy">{item.purchased.toFixed(1)} kg</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Used</p>
                  <p className="text-xs font-semibold text-navy">{item.used.toFixed(1)} kg</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">On Hand</p>
                  <p className={`text-xs font-bold ${item.onHand < 0 ? 'text-accent-red' : 'text-navy'}`}>
                    {item.onHand.toFixed(1)} kg
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
