'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DrinksSummary } from '@/lib/processing';

interface DrinksChartProps {
  data: DrinksSummary[];
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DrinksSummary; value: number }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border border-gray-100">
      <div className="flex items-center gap-2 text-xs">
        <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
        <span className="font-semibold text-navy">{item.name}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {item.total.toLocaleString()} bottles
      </p>
    </div>
  );
}

export default function DrinksChart({ data }: DrinksChartProps) {
  const totalBottles = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="card-hover bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-navy">Drinks Consumption</h3>
          <p className="text-xs text-gray-400 mt-0.5">Total: {totalBottles.toLocaleString()} bottles</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" horizontal={false} />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A0AEC0', fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4A5568', fontSize: 12, fontWeight: 500 }}
              width={75}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F7FAFC' }} />
            <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={24}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
