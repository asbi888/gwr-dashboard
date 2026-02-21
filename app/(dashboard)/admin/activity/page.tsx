'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { selectClass, inputClass } from '@/components/ui/FormField';

interface ActivityRecord {
  id: string;
  user_id: string;
  email: string;
  action: 'login' | 'page_view' | 'logout';
  page: string | null;
  created_at: string;
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Fetch activity data directly from Supabase (RLS allows admin SELECT)
  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_activity')
        .select('id, user_id, email, action, page, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filterUser) query = query.eq('user_id', filterUser);
      if (filterType) query = query.eq('action', filterType);
      if (filterFrom) query = query.gte('created_at', new Date(filterFrom).toISOString());
      if (filterTo) {
        const toDate = new Date(filterTo);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      const { data } = await query;
      setActivities((data as ActivityRecord[]) || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [filterUser, filterType, filterFrom, filterTo]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Unique users from activities (no separate user fetch needed)
  const uniqueUsers = Array.from(
    new Map(activities.map((a) => [a.user_id, a.email])).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  // Helpers
  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const pageLabel = (path: string) => {
    const map: Record<string, string> = {
      '/': 'Overview',
      '/revenue/trend': 'Revenue Trend',
      '/revenue/weekly': 'Revenue Weekly',
      '/revenue/clients': 'Revenue by Client',
      '/revenue/menu': 'Revenue by Menu',
      '/revenue/wr-trips': 'WR Trips',
      '/expenses/suppliers': 'Expenses by Supplier',
      '/expenses/transactions': 'All Transactions',
      '/expenses/odoo-export': 'Odoo Export',
      '/operations/inventory': 'Inventory',
      '/operations/food-cost': 'Food Cost',
      '/operations/drinks-cost': 'Drinks Cost',
      '/operations/data-entry': 'Data Entry',
      '/admin/users': 'User Management',
      '/admin/activity': 'Activity Log',
    };
    return map[path] || path;
  };

  // Summary calculations
  const today = new Date().toISOString().slice(0, 10);
  const loginsToday = activities.filter(
    (a) => a.action === 'login' && a.created_at.slice(0, 10) === today,
  ).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const activeUsersThisWeek = new Set(
    activities
      .filter((a) => new Date(a.created_at) >= weekAgo)
      .map((a) => a.user_id),
  ).size;

  const pageCounts: Record<string, number> = {};
  activities.forEach((a) => {
    if (a.action === 'page_view' && a.page) {
      const label = pageLabel(a.page);
      pageCounts[label] = (pageCounts[label] || 0) + 1;
    }
  });
  const topPage = Object.entries(pageCounts).sort((a, b) => b[1] - a[1])[0];

  const typeColors: Record<string, string> = {
    login: 'bg-green-100 text-green-700',
    page_view: 'bg-blue-100 text-blue-700',
    logout: 'bg-gray-100 text-gray-500',
  };

  const typeLabels: Record<string, string> = {
    login: 'Login',
    page_view: 'Page View',
    logout: 'Logout',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-navy">Activity Log</h1>
        <p className="text-xs text-gray-400 mt-1">
          Track user logins and page visits
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Logins Today
          </p>
          <p className="text-2xl font-bold text-navy mt-1">{loginsToday}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Active Users (7d)
          </p>
          <p className="text-2xl font-bold text-navy mt-1">{activeUsersThisWeek}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Most Visited Page
          </p>
          <p className="text-lg font-bold text-navy mt-1 truncate">
            {topPage ? `${topPage[0]} (${topPage[1]})` : '-'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className={selectClass}
          >
            <option value="">All Users</option>
            {uniqueUsers.map(([id, email]) => (
              <option key={id} value={id}>
                {email}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={selectClass}
          >
            <option value="">All Types</option>
            <option value="login">Logins</option>
            <option value="page_view">Page Views</option>
          </select>

          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            placeholder="From"
            className={inputClass}
          />

          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            placeholder="To"
            className={inputClass}
          />
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">No activity found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Page
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-[10px] font-bold flex-shrink-0"
                          style={{
                            background:
                              'linear-gradient(135deg, #7B61FF 0%, #4FD1C5 100%)',
                          }}
                        >
                          {getInitials(a.email)}
                        </div>
                        <span className="text-xs font-medium text-navy">
                          {a.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${typeColors[a.action] || 'bg-gray-100 text-gray-500'}`}
                      >
                        {typeLabels[a.action] || a.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {a.action === 'login'
                        ? '-'
                        : a.page
                          ? pageLabel(a.page)
                          : '-'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400">
                      {formatDateTime(a.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
