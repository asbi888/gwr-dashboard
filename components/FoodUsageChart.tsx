'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FoodChartPoint } from '@/lib/processing';

interface FoodUsageChartProps {
  data: FoodChartPoint[];
}

const PRODUCT_COLORS = {
  poulet: { purchased: '#FFB547', used: '#F6AD55' },
  langoustes: { purchased: '#FF6B6B', used: '#FC8181' },
  poisson: { purchased: '#4FD1C5', used: '#38B2AC' },
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border border-gray-100">
      <p className="text-xs font-semibold text-navy mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-700">{entry.value} kg</span>
        </div>
      ))}
    </div>
  );
}

export default function FoodUsageChart({ data }: FoodUsageChartProps) {
  return (
    <div className="card-hover bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-navy">Food: Purchased vs Used</h3>
          <p className="text-xs text-gray-400 mt-0.5">Monthly comparison (kg)</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full" style={{ background: PRODUCT_COLORS.poulet.purchased }} />
          <span className="text-[10px] text-gray-400">Chicken (bought)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full" style={{ background: PRODUCT_COLORS.poulet.used, opacity: 0.6 }} />
          <span className="text-[10px] text-gray-400">Chicken (used)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full" style={{ background: PRODUCT_COLORS.langoustes.purchased }} />
          <span className="text-[10px] text-gray-400">Langoustes (bought)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full" style={{ background: PRODUCT_COLORS.langoustes.used, opacity: 0.6 }} />
          <span className="text-[10px] text-gray-400">Langoustes (used)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full" style={{ background: PRODUCT_COLORS.poisson.purchased }} />
          <span className="text-[10px] text-gray-400">Fish (bought)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full" style={{ background: PRODUCT_COLORS.poisson.used, opacity: 0.6 }} />
          <span className="text-[10px] text-gray-400">Fish (used)</span>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A0AEC0', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A0AEC0', fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Chicken */}
            <Line type="monotone" dataKey="purchasedPoulet" name="Chicken (bought)" stroke={PRODUCT_COLORS.poulet.purchased} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: PRODUCT_COLORS.poulet.purchased, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="usedPoulet" name="Chicken (used)" stroke={PRODUCT_COLORS.poulet.used} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, fill: PRODUCT_COLORS.poulet.used, strokeWidth: 2, stroke: '#fff' }} />

            {/* Langoustes */}
            <Line type="monotone" dataKey="purchasedLangoustes" name="Langoustes (bought)" stroke={PRODUCT_COLORS.langoustes.purchased} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: PRODUCT_COLORS.langoustes.purchased, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="usedLangoustes" name="Langoustes (used)" stroke={PRODUCT_COLORS.langoustes.used} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, fill: PRODUCT_COLORS.langoustes.used, strokeWidth: 2, stroke: '#fff' }} />

            {/* Fish */}
            <Line type="monotone" dataKey="purchasedPoisson" name="Fish (bought)" stroke={PRODUCT_COLORS.poisson.purchased} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: PRODUCT_COLORS.poisson.purchased, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="usedPoisson" name="Fish (used)" stroke={PRODUCT_COLORS.poisson.used} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4, fill: PRODUCT_COLORS.poisson.used, strokeWidth: 2, stroke: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
