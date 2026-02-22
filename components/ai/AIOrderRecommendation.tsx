'use client';

import type { OrderRecommendation } from '@/lib/ai-insights';
import AIBadge from './AIBadge';

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  urgent: { bg: '#FED7D7', text: '#C53030', label: 'URGENT' },
  medium: { bg: '#FEFCBF', text: '#975A16', label: 'MEDIUM' },
  low: { bg: '#C6F6D5', text: '#276749', label: 'LOW' },
};

export default function AIOrderRecommendation({
  recommendations,
}: {
  recommendations: OrderRecommendation[];
}) {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5 h-full"
      style={{ borderLeft: '4px solid transparent', borderImage: 'linear-gradient(to bottom, #7B61FF, #4FD1C5) 1' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-navy">Smart Order Recommendation</p>
        <AIBadge label="AI" />
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const style = PRIORITY_STYLES[rec.priority];
          return (
            <div key={rec.productKey} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-navy">{rec.product}</span>
                <span
                  className="px-2 py-0.5 rounded text-[9px] font-bold"
                  style={{ backgroundColor: style.bg, color: style.text }}
                >
                  {style.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-gray-400">Stock:</span>{' '}
                  <span className="font-semibold text-navy">{rec.currentStock} kg</span>
                </div>
                <div>
                  <span className="text-gray-400">Avg/day:</span>{' '}
                  <span className="font-semibold text-navy">{rec.avgDailyUse} kg</span>
                </div>
                <div>
                  <span className="text-gray-400">Days left:</span>{' '}
                  <span
                    className="font-semibold"
                    style={{ color: rec.daysUntilStockout < 3 ? '#FF6B6B' : rec.daysUntilStockout < 7 ? '#FFB547' : '#01B574' }}
                  >
                    {rec.daysUntilStockout > 90 ? '90+' : rec.daysUntilStockout}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Order:</span>{' '}
                  <span className="font-bold text-primary">
                    {rec.suggestedOrder > 0 ? `${rec.suggestedOrder} kg` : '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[10px] text-gray-300">AI Confidence: 87%</span>
        <button className="text-[10px] text-primary font-medium hover:text-primary-dark transition-colors">
          Create Purchase Order
        </button>
      </div>
    </div>
  );
}
