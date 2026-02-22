'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardData } from '@/lib/data-context';
import { generateDemandForecast } from '@/lib/ai-insights';
import AIBadge from './AIBadge';
import { SparkleIcon } from './icons';
import AIOrderRecommendation from './AIOrderRecommendation';

function DemandTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-navy mb-1.5">{label}</p>
      {payload.map((p: { value: number; name: string; color: string }, i: number) => (
        <p key={i} className="text-[10px]" style={{ color: p.color }}>
          {p.name}: {p.value} kg
        </p>
      ))}
    </div>
  );
}

export default function AIDemandForecast({ data }: { data: DashboardData }) {
  const { forecast, recommendations } = useMemo(() => generateDemandForecast(data), [data]);

  if (forecast.length === 0) return null;

  return (
    <div className="animate-fade-in-up opacity-0 delay-200 mb-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
        >
          <SparkleIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-navy">AI Demand Intelligence</span>
            <AIBadge />
          </div>
          <p className="text-[10px] text-gray-400">7-day usage forecast based on historical patterns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Chart — 3 columns */}
        <div
          className="lg:col-span-3 bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5"
          style={{ borderLeft: '4px solid transparent', borderImage: 'linear-gradient(to bottom, #7B61FF, #4FD1C5) 1' }}
        >
          <p className="text-xs font-semibold text-navy mb-3">7-Day Usage Forecast (kg)</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 10, fill: '#A0AEC0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#A0AEC0' }} />
                <Tooltip content={<DemandTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="poulet"
                  name="Chicken"
                  stroke="#FF6B6B"
                  fill="#FF6B6B"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="langoustes"
                  name="Langoustes"
                  stroke="#7B61FF"
                  fill="#7B61FF"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="poisson"
                  name="Fish"
                  stroke="#4FD1C5"
                  fill="#4FD1C5"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendations — 2 columns */}
        <div className="lg:col-span-2">
          <AIOrderRecommendation recommendations={recommendations} />
        </div>
      </div>
    </div>
  );
}
