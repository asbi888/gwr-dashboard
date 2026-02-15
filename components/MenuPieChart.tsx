'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MenuData {
  name: string;
  value: number;
  quantity: number;
}

interface MenuPieChartProps {
  data: MenuData[];
}

const COLORS = [
  '#7B61FF',
  '#4FD1C5',
  '#667eea',
  '#FF6B6B',
  '#FFB547',
  '#01B574',
  '#D53F8C',
  '#3182CE',
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: MenuData }> }) {
  if (!active || !payload) return null;
  const entry = payload[0];
  return (
    <div className="bg-white rounded-xl p-3 shadow-xl border border-gray-100">
      <p className="text-xs font-semibold text-navy mb-1">{entry.name}</p>
      <p className="text-sm font-bold text-primary">
        Rs {entry.value.toLocaleString()}
      </p>
      <p className="text-xs text-gray-400">
        {entry.payload.quantity} orders
      </p>
    </div>
  );
}

export default function MenuPieChart({ data }: MenuPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-500 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-navy">Menu Performance</h3>
        <p className="text-xs text-gray-400 mt-0.5">Revenue by menu item</p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-2 space-y-2">
        {data.slice(0, 6).map((item, idx) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: COLORS[idx % COLORS.length] }}
                />
                <span className="text-xs text-gray-600 truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-semibold text-navy shrink-0 ml-2">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MenuPieChartSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="h-5 w-36 rounded animate-shimmer mb-2" />
      <div className="h-3 w-28 rounded animate-shimmer mb-4" />
      <div className="h-52 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full animate-shimmer" />
      </div>
      <div className="mt-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full animate-shimmer" />
              <div className="h-3 w-20 rounded animate-shimmer" />
            </div>
            <div className="h-3 w-8 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
