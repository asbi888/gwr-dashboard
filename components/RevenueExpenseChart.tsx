'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface RevenueExpenseChartProps {
  data: MonthlyData[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border border-gray-100">
      <p className="text-xs font-semibold text-navy mb-2">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-700">
            Rs {(entry.value / 1000).toFixed(0)}K
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-200 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-navy">Revenue vs Expenses</h3>
          <p className="text-xs text-gray-400 mt-0.5">Monthly comparison</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-primary" />
            <span className="text-xs text-gray-400">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-secondary" />
            <span className="text-xs text-gray-400">Expenses</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#7B61FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4FD1C5" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#4FD1C5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#EDF2F7"
              vertical={false}
            />
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              dx={-4}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={() => null} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#7B61FF"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#7B61FF', strokeWidth: 2, stroke: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#4FD1C5"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#4FD1C5', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RevenueExpenseChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="h-5 w-40 rounded animate-shimmer mb-2" />
      <div className="h-3 w-28 rounded animate-shimmer mb-6" />
      <div className="h-72 rounded-xl animate-shimmer" />
    </div>
  );
}
