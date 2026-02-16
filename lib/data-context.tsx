'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  fetchDashboardData,
  type Expense,
  type Supplier,
  type Revenue,
  type RevenueLine,
  type FoodUsage,
  type DrinksUsage,
  type WRRevenue,
} from './supabase';

export interface DashboardData {
  expenses: Expense[];
  suppliers: Supplier[];
  revenue: Revenue[];
  revenueLines: RevenueLine[];
  foodUsage: FoodUsage[];
  drinksUsage: DrinksUsage[];
  wrRevenue: WRRevenue[];
}

interface DataContextValue {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  data: null,
  loading: true,
  error: null,
  lastRefreshed: null,
  refresh: async () => {},
});

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const result = await fetchDashboardData();
      setData(result);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: unknown) {
      if (isInitial) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Auto-refresh every 30 seconds (silent)
  useEffect(() => {
    const interval = setInterval(() => loadData(false), 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        lastRefreshed,
        refresh: () => loadData(true),
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDashboardData() {
  return useContext(DataContext);
}
