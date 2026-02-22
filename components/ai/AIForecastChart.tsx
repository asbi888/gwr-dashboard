'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { generateRevenueForecast, type ForecastPoint } from '@/lib/ai-insights';
import { formatCurrencyFull } from '@/lib/utils';
import AIBadge from './AIBadge';
import { SparkleIcon } from './icons';

interface Props {
  monthlyData: { month: string; revenue: number; expenses: number }[];
}

function ForecastTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; dataKey: string }[]; label?: string }) {
  if (!active || !payload) return null;
  const isForecast = payload.some((p: { dataKey: string }) => p.dataKey === 'revUpper');
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-navy mb-1.5">
        {label} {isForecast && <span className="text-primary text-[9px]">(Forecast)</span>}
      </p>
      {payload
        .filter((p: { dataKey: string }) => p.dataKey === 'revenue' || p.dataKey === 'expenses')
        .map((p: { value: number; name: string; dataKey: string }, i: number) => (
          <p key={i} className="text-[10px]" style={{ color: p.dataKey === 'revenue' ? '#7B61FF' : '#4FD1C5' }}>
            {p.dataKey === 'revenue' ? 'Revenue' : 'Expenses'}: {formatCurrencyFull(p.value)}
          </p>
        ))}
    </div>
  );
}

export default function AIForecastChart({ monthlyData }: Props) {
  const { data, projectedRevenue, projectedMargin, marginChange } = useMemo(
    () => generateRevenueForecast(monthlyData),
    [monthlyData]
  );

  if (data.length < 3) return null;

  // Find the boundary index
  const boundaryIndex = data.findIndex((d) => d.isForecast);
  const boundaryMonth = boundaryIndex > 0 ? data[boundaryIndex - 1].month : '';

  // For the chart, add null revUpper/revLower to historical points
  const chartData = data.map((d) => ({
    ...d,
    revUpper: d.isForecast ? d.revUpper : undefined,
    revLower: d.isForecast ? d.revLower : undefined,
  }));

  return (
    <div className="animate-fade-in-up opacity-0 delay-200">
      <div
        className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5"
        style={{ borderLeft: '4px solid transparent', borderImage: 'linear-gradient(to bottom, #7B61FF, #4FD1C5) 1' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)' }}
            >
              <SparkleIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-navy">Revenue & Expense Forecast</span>
                <AIBadge />
              </div>
              <p className="text-[10px] text-gray-400">3-month projection based on historical trends</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#A0AEC0' }} />
              <YAxis
                tick={{ fontSize: 10, fill: '#A0AEC0' }}
                tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip content={<ForecastTooltip />} />

              {/* Confidence band */}
              <Area
                dataKey="revUpper"
                stroke="none"
                fill="#7B61FF"
                fillOpacity={0.08}
                connectNulls={false}
              />
              <Area
                dataKey="revLower"
                stroke="none"
                fill="#FFFFFF"
                fillOpacity={1}
                connectNulls={false}
              />

              {/* Solid historical lines */}
              <Line
                dataKey="revenue"
                stroke="#7B61FF"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Line
                dataKey="expenses"
                stroke="#4FD1C5"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

              {/* Today boundary */}
              {boundaryMonth && (
                <ReferenceLine
                  x={boundaryMonth}
                  stroke="#A0AEC0"
                  strokeDasharray="4 4"
                  label={{ value: 'Today', position: 'top', fontSize: 10, fill: '#A0AEC0' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Projection KPIs */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Projected 3-Month Rev</p>
            <p className="text-sm font-bold text-navy mt-0.5">{formatCurrencyFull(projectedRevenue)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Projected Margin</p>
            <p className="text-sm font-bold text-navy mt-0.5">{projectedMargin}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Margin Trend</p>
            <p className={`text-sm font-bold mt-0.5 ${marginChange >= 0 ? 'text-success' : 'text-accent-red'}`}>
              {marginChange >= 0 ? '+' : ''}{marginChange}pp
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <span className="text-[10px] text-gray-300">Linear trend regression on last 12 months</span>
        </div>
      </div>
    </div>
  );
}
