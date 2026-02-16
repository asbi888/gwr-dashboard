'use client';

import { formatCurrencyFull } from '@/lib/utils';

interface SupplierData {
  name: string;
  category: string;
  total: number;
}

interface TopSuppliersTableProps {
  data: SupplierData[];
  onSupplierClick?: (name: string) => void;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  'Food & Beverage': { bg: '#F0EDFF', text: '#7B61FF' },
  'Seafood': { bg: '#E6FFFA', text: '#319795' },
  'Meat': { bg: '#FFF5F5', text: '#E53E3E' },
  'Dairy': { bg: '#FFFAF0', text: '#DD6B20' },
  'Produce': { bg: '#F0FFF4', text: '#38A169' },
  'Supplies': { bg: '#EBF8FF', text: '#3182CE' },
  'Utilities': { bg: '#FFF5F7', text: '#D53F8C' },
  default: { bg: '#F7FAFC', text: '#718096' },
};

function getCategoryStyle(category: string) {
  const key = Object.keys(categoryColors).find((k) =>
    category?.toLowerCase().includes(k.toLowerCase())
  );
  return categoryColors[key || 'default'];
}

export default function TopSuppliersTable({ data, onSupplierClick }: TopSuppliersTableProps) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="card-hover animate-fade-in-up opacity-0 delay-400 bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-navy">Top Suppliers</h3>
        <p className="text-xs text-gray-400 mt-0.5">By total spend</p>
      </div>
      <div className="space-y-4">
        {data.map((supplier, idx) => {
          const catStyle = getCategoryStyle(supplier.category);
          return (
            <div
              key={supplier.name}
              onClick={() => onSupplierClick?.(supplier.name)}
              className={onSupplierClick ? 'cursor-pointer rounded-xl px-2 py-1.5 -mx-2 hover:bg-gray-50 transition-colors group/row' : ''}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold text-white shrink-0"
                    style={{
                      background:
                        idx === 0
                          ? 'linear-gradient(135deg, #667eea, #764ba2)'
                          : idx === 1
                          ? 'linear-gradient(135deg, #4FD1C5, #38B2AC)'
                          : 'linear-gradient(135deg, #A0AEC0, #CBD5E0)',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate flex items-center gap-1">
                      {supplier.name}
                      {onSupplierClick && (
                        <svg className="w-3 h-3 text-gray-300 group-hover/row:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </p>
                    <span
                      className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        backgroundColor: catStyle.bg,
                        color: catStyle.text,
                      }}
                    >
                      {supplier.category || 'General'}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold text-navy shrink-0 ml-2">
                  {formatCurrencyFull(supplier.total)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${(supplier.total / maxTotal) * 100}%`,
                    background:
                      idx === 0
                        ? 'linear-gradient(90deg, #667eea, #764ba2)'
                        : idx === 1
                        ? 'linear-gradient(90deg, #4FD1C5, #38B2AC)'
                        : 'linear-gradient(90deg, #A0AEC0, #CBD5E0)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopSuppliersTableSkeleton() {
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
                <div className="h-4 w-28 rounded animate-shimmer mb-1" />
                <div className="h-4 w-14 rounded-full animate-shimmer" />
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
