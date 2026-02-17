'use client';

import { useState } from 'react';
import PageShell from '@/components/PageShell';
import TabBar from '@/components/ui/TabBar';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { useDashboardData } from '@/lib/data-context';
import FoodUsageForm from '@/components/forms/FoodUsageForm';
import DrinksUsageForm from '@/components/forms/DrinksUsageForm';
import WRRevenueForm from '@/components/forms/WRRevenueForm';
import ExpenseForm from '@/components/forms/ExpenseForm';
import RevenueForm from '@/components/forms/RevenueForm';
import InlineActions from '@/components/InlineActions';
import { deleteFoodUsage, deleteDrinksUsage, deleteWRRevenue, deleteExpense, deleteRevenue } from '@/lib/mutations';
import { formatDate, formatCurrencyFull } from '@/lib/utils';
import type { FoodUsage, DrinksUsage, WRRevenue, Expense, Revenue } from '@/lib/supabase';

const TABS = [
  {
    key: 'food',
    label: 'Food Usage',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    key: 'drinks',
    label: 'Drinks',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    key: 'wr',
    label: 'WR Revenue',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  {
    key: 'revenue',
    label: 'Revenue',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function DataEntryPage() {
  const { refresh } = useDashboardData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('food');

  // Edit/delete state — use a union type to avoid 'unknown' issues with JSX
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number | string; label: string } | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      switch (deleteTarget.type) {
        case 'food': await deleteFoodUsage(deleteTarget.id as number); break;
        case 'drinks': await deleteDrinksUsage(deleteTarget.id as number); break;
        case 'wr': await deleteWRRevenue(deleteTarget.id as number); break;
        case 'expenses': await deleteExpense(deleteTarget.id as string); break;
        case 'revenue': await deleteRevenue(deleteTarget.id as string); break;
      }
      toast('Record deleted', 'success');
      await refresh();
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  }

  return (
    <PageShell
      title="Data Entry"
      subtitle="Add and manage records directly"
      icon={
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      }
    >
      {(data) => {
        // Unique client names from existing revenue records (sorted A-Z)
        const revenueClients = [...new Set(data.revenue.map((r) => r.client_name).filter(Boolean))].sort();
        // Unique supplier names from existing expenses (sorted A-Z)
        const expenseSuppliers = [...new Set(data.expenses.map((r) => r.supplier_name).filter(Boolean))].sort();

        return (
        <>
          {/* Tab Bar */}
          <div className="animate-fade-in-up opacity-0 delay-100 mb-6">
            <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in-up opacity-0 delay-200">
            {/* ── FOOD USAGE TAB ── */}
            {activeTab === 'food' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                  <h3 className="text-sm font-bold text-navy mb-4">Add Food Usage</h3>
                  <FoodUsageForm onSave={() => {}} onCancel={() => {}} />
                </div>
                <RecentTable
                  title="Recent Food Usage"
                  columns={['Date', 'Poulet', 'Langoustes', 'Poisson', 'Total KG']}
                  rows={data.foodUsage.slice(0, 20).map((r) => ({
                    id: r.staging_id,
                    cells: [formatDate(r.usage_date), `${r.poulet_kg} kg`, `${r.langoustes_kg} kg`, `${r.poisson_kg} kg`, `${r.total_kg} kg`],
                  }))}
                  onEdit={(id) => setEditItem(data.foodUsage.find((r) => r.staging_id === id))}
                  onDelete={(id) => setDeleteTarget({ type: 'food', id, label: `food usage for ${data.foodUsage.find((r) => r.staging_id === id)?.usage_date}` })}
                />
              </div>
            )}

            {/* ── DRINKS USAGE TAB ── */}
            {activeTab === 'drinks' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                  <h3 className="text-sm font-bold text-navy mb-4">Add Drinks Usage</h3>
                  <DrinksUsageForm onSave={() => {}} onCancel={() => {}} />
                </div>
                <RecentTable
                  title="Recent Drinks Usage"
                  columns={['Date', 'Coca', 'Sprite', 'Beer', 'Rhum', 'Rose', 'Blanc', 'Total']}
                  rows={data.drinksUsage.slice(0, 20).map((r) => ({
                    id: r.staging_id,
                    cells: [formatDate(r.usage_date), `${r.coca_cola_bottles}`, `${r.sprite_bottles}`, `${r.beer_bottles}`, `${r.rhum_bottles}`, `${r.rose_bottles}`, `${r.blanc_bottles}`, `${r.total_bottles}`],
                  }))}
                  onEdit={(id) => setEditItem(data.drinksUsage.find((r) => r.staging_id === id))}
                  onDelete={(id) => setDeleteTarget({ type: 'drinks', id, label: `drinks usage for ${data.drinksUsage.find((r) => r.staging_id === id)?.usage_date}` })}
                />
              </div>
            )}

            {/* ── WR REVENUE TAB ── */}
            {activeTab === 'wr' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                  <h3 className="text-sm font-bold text-navy mb-4">Add WR Revenue</h3>
                  <WRRevenueForm onSave={() => {}} onCancel={() => {}} />
                </div>
                <RecentTable
                  title="Recent WR Revenue"
                  columns={['Date', 'Client', 'Trip', 'Amount']}
                  rows={data.wrRevenue.slice(0, 20).map((r) => ({
                    id: r.staging_id,
                    cells: [formatDate(r.revenue_date), r.client_name, r.trip_description, formatCurrencyFull(r.amount)],
                  }))}
                  onEdit={(id) => setEditItem(data.wrRevenue.find((r) => r.staging_id === id))}
                  onDelete={(id) => setDeleteTarget({ type: 'wr', id, label: `WR revenue for ${data.wrRevenue.find((r) => r.staging_id === id)?.revenue_date}` })}
                />
              </div>
            )}

            {/* ── EXPENSES TAB ── */}
            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                  <h3 className="text-sm font-bold text-navy mb-4">Add Expense</h3>
                  <ExpenseForm supplierSuggestions={expenseSuppliers} onSave={() => {}} onCancel={() => {}} />
                </div>
                <RecentTable
                  title="Recent Expenses"
                  columns={['Date', 'Description', 'Category', 'Total']}
                  rows={data.expenses.slice(0, 20).map((r) => ({
                    id: r.expense_id,
                    cells: [formatDate(r.expense_date), r.description, r.category || 'General', formatCurrencyFull(r.total_amount)],
                  }))}
                  onEdit={(id) => setEditItem(data.expenses.find((r) => r.expense_id === id))}
                  onDelete={(id) => setDeleteTarget({ type: 'expenses', id: id as string, label: `expense: ${data.expenses.find((r) => r.expense_id === id)?.description}` })}
                />
              </div>
            )}

            {/* ── REVENUE TAB ── */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
                  <h3 className="text-sm font-bold text-navy mb-4">Add Revenue Order</h3>
                  <RevenueForm clientSuggestions={revenueClients} onSave={() => {}} onCancel={() => {}} />
                </div>
                <RecentTable
                  title="Recent Revenue Orders"
                  columns={['Date', 'Client', 'Pax', 'Total']}
                  rows={data.revenue.slice(0, 20).map((r) => ({
                    id: r.revenue_id,
                    cells: [formatDate(r.revenue_date), r.client_name, `${r.pax_count}`, formatCurrencyFull(r.total_revenue)],
                  }))}
                  onEdit={(id) => setEditItem(data.revenue.find((r) => r.revenue_id === id))}
                  onDelete={(id) => setDeleteTarget({ type: 'revenue', id: id as string, label: `revenue order for ${data.revenue.find((r) => r.revenue_id === id)?.client_name}` })}
                />
              </div>
            )}
          </div>

          {/* ── Edit Modals ── */}
          {/* Food Usage Edit */}
          <Modal
            open={!!editItem && activeTab === 'food'}
            onClose={() => setEditItem(null)}
            title="Edit Food Usage"
          >
            {editItem && activeTab === 'food' && (
              <FoodUsageForm
                initialData={editItem as FoodUsage}
                onSave={() => setEditItem(null)}
                onCancel={() => setEditItem(null)}
              />
            )}
          </Modal>

          {/* Drinks Usage Edit */}
          <Modal
            open={!!editItem && activeTab === 'drinks'}
            onClose={() => setEditItem(null)}
            title="Edit Drinks Usage"
          >
            {editItem && activeTab === 'drinks' && (
              <DrinksUsageForm
                initialData={editItem as DrinksUsage}
                onSave={() => setEditItem(null)}
                onCancel={() => setEditItem(null)}
              />
            )}
          </Modal>

          {/* WR Revenue Edit */}
          <Modal
            open={!!editItem && activeTab === 'wr'}
            onClose={() => setEditItem(null)}
            title="Edit WR Revenue"
          >
            {editItem && activeTab === 'wr' && (
              <WRRevenueForm
                initialData={editItem as WRRevenue}
                onSave={() => setEditItem(null)}
                onCancel={() => setEditItem(null)}
              />
            )}
          </Modal>

          {/* Expense Edit */}
          <Modal
            open={!!editItem && activeTab === 'expenses'}
            onClose={() => setEditItem(null)}
            title="Edit Expense"
            size="lg"
          >
            {editItem && activeTab === 'expenses' && (
              <ExpenseForm
                initialData={editItem as Expense}
                supplierSuggestions={expenseSuppliers}
                onSave={() => setEditItem(null)}
                onCancel={() => setEditItem(null)}
              />
            )}
          </Modal>

          {/* Revenue Edit */}
          <Modal
            open={!!editItem && activeTab === 'revenue'}
            onClose={() => setEditItem(null)}
            title="Edit Revenue Order"
            size="lg"
          >
            {editItem && activeTab === 'revenue' && (
              <RevenueForm
                initialData={editItem as Revenue}
                initialLines={data.revenueLines.filter((l) => l.revenue_id === (editItem as Revenue).revenue_id)}
                clientSuggestions={revenueClients}
                onSave={() => setEditItem(null)}
                onCancel={() => setEditItem(null)}
              />
            )}
          </Modal>

          {/* Delete Confirmation */}
          <ConfirmDialog
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
            title="Delete Record"
            message={`Are you sure you want to delete this ${deleteTarget?.label ?? 'record'}? This action cannot be undone.`}
            variant="danger"
          />
        </>
        );
      }}
    </PageShell>
  );
}

// ── Reusable Recent Records Table ──

interface RecentTableProps {
  title: string;
  columns: string[];
  rows: { id: number | string; cells: string[] }[];
  onEdit: (id: number | string) => void;
  onDelete: (id: number | string) => void;
}

function RecentTable({ title, columns, rows, onEdit, onDelete }: RecentTableProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg shadow-gray-200/50">
      <h3 className="text-sm font-bold text-navy mb-4">
        {title}
        <span className="text-gray-400 font-normal ml-2">({rows.length} records)</span>
      </h3>
      {rows.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">No records yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map((col) => (
                  <th key={col} className="pb-3 pr-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="pb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {row.cells.map((cell, ci) => (
                    <td key={ci} className="py-2.5 pr-3 text-xs text-gray-600 whitespace-nowrap max-w-[160px] truncate">
                      {cell}
                    </td>
                  ))}
                  <td className="py-2.5 text-right">
                    <InlineActions
                      onEdit={() => onEdit(row.id)}
                      onDelete={() => onDelete(row.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
