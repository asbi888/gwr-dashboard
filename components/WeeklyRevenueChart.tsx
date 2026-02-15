'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeeklyData {
  week: string;
  total: number;
}

interface WeeklyRevenueChartProps {
  data: WeeklyData[];
  subtitle?: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border border-gray-100">
      <p className="text-xs font-semibold text-navy mb-1">Week of {label}</p>
      <p className="text-sm font-bold text-primary">
        Rs {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
}

export default function WeeklyRevenueChart({ data, subtitle }: WeeklyRevenueChartProps) {
  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-300 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-navy">Weekly Revenue</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle || 'Last 9 weeks'}</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#4FD1C5" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#EDF2F7"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A0AEC0', fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A0AEC0', fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="total"
              fill="url(#barGradient)"
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function WeeklyRevenueChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="h-5 w-36 rounded animate-shimmer mb-2" />
      <div className="h-3 w-24 rounded animate-shimmer mb-6" />
      <div className="h-72 rounded-xl animate-shimmer" />
    </div>
  );
}
