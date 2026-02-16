'use client';

import type { InventoryItem } from '@/lib/processing';

interface InventoryAlertCardProps {
  item: InventoryItem;
  delay?: string;
}

const STATUS_CONFIG = {
  green: {
    gradient: 'linear-gradient(135deg, #01B574 0%, #38D9A9 100%)',
    label: 'HEALTHY',
    labelBg: '#01B574',
  },
  yellow: {
    gradient: 'linear-gradient(135deg, #FFB547 0%, #F6AD55 100%)',
    label: 'LOW STOCK',
    labelBg: '#FFB547',
  },
  red: {
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FC8181 100%)',
    label: 'CRITICAL',
    labelBg: '#FF6B6B',
  },
};

export default function InventoryAlertCard({ item, delay = '' }: InventoryAlertCardProps) {
  const config = STATUS_CONFIG[item.status];

  return (
    <div className={`card-hover animate-fade-in-up opacity-0 ${delay} bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {item.product}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-navy">
            {item.onHand.toFixed(1)} kg
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: config.labelBg }}
            >
              {config.label}
            </span>
            <span className="text-xs text-gray-400">
              ~{item.daysSupply > 900 ? '999+' : item.daysSupply} days supply
            </span>
          </div>
        </div>
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
          style={{ background: config.gradient }}
        >
          {item.status === 'red' ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ) : item.status === 'yellow' ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>
      {/* Mini stats */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
        <div>
          <p className="text-[10px] text-gray-400">Purchased</p>
          <p className="text-xs font-semibold text-navy">{item.purchased.toFixed(1)} kg</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Used</p>
          <p className="text-xs font-semibold text-navy">{item.used.toFixed(1)} kg</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">Avg/Day</p>
          <p className="text-xs font-semibold text-navy">{item.avgDailyUse} kg</p>
        </div>
      </div>
    </div>
  );
}
