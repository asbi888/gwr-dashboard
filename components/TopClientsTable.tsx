'use client';

import { formatCurrencyFull } from '@/lib/utils';

interface ClientData {
  name: string;
  orders: number;
  revenue: number;
}

interface TopClientsTableProps {
  data: ClientData[];
}

export default function TopClientsTable({ data }: TopClientsTableProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-300 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-navy">Top Clients</h3>
        <p className="text-xs text-gray-400 mt-0.5">By total revenue</p>
      </div>
      <div className="space-y-4">
        {data.map((client, idx) => (
          <div key={client.name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white shrink-0"
                  style={{
                    background:
                      idx === 0
                        ? 'linear-gradient(135deg, #7B61FF, #9F8FFF)'
                        : idx === 1
                        ? 'linear-gradient(135deg, #4FD1C5, #81E6D9)'
                        : 'linear-gradient(135deg, #A0AEC0, #CBD5E0)',
                  }}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy truncate">
                    {client.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {client.orders} orders
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-navy shrink-0 ml-2">
                {formatCurrencyFull(client.revenue)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(client.revenue / maxRevenue) * 100}%`,
                  background:
                    idx === 0
                      ? 'linear-gradient(90deg, #7B61FF, #9F8FFF)'
                      : idx === 1
                      ? 'linear-gradient(90deg, #4FD1C5, #81E6D9)'
                      : 'linear-gradient(90deg, #A0AEC0, #CBD5E0)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopClientsTableSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="h-5 w-28 rounded animate-shimmer mb-2" />
      <div className="h-3 w-24 rounded animate-shimmer mb-5" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg animate-shimmer" />
              <div>
                <div className="h-4 w-24 rounded animate-shimmer mb-1" />
                <div className="h-3 w-16 rounded animate-shimmer" />
              </div>
            </div>
            <div className="h-4 w-16 rounded animate-shimmer" />
          </div>
          <div className="h-1.5 w-full rounded-full animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
