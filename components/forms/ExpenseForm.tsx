'use client';

import { useState } from 'react';
import type { Expense, Supplier } from '@/lib/supabase';
import { insertExpense, updateExpense } from '@/lib/mutations';
import { useDashboardData } from '@/lib/data-context';
import { useToast } from '@/components/ui/Toast';
import FormField, { inputClass, selectClass } from '@/components/ui/FormField';

interface ExpenseFormProps {
  initialData?: Expense;
  suppliers: Supplier[];
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Food-Poultry', 'Food-Seafood', 'Beverage-Alcoholic', 'Beverage-Soft',
  'Cleaning', 'Fuel', 'Equipment', 'Maintenance', 'Office', 'Transport', 'General',
];

const UNITS = ['kg', 'pcs', 'bottles', 'litres', 'units'];
const PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'Credit Card'];

export default function ExpenseForm({ initialData, suppliers, onSave, onCancel }: ExpenseFormProps) {
  const { refresh } = useDashboardData();
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    expense_date: initialData?.expense_date ?? new Date().toISOString().split('T')[0],
    description: initialData?.description ?? '',
    category: initialData?.category ?? 'General',
    quantity: initialData?.quantity ?? 0,
    unit_of_measure: initialData?.unit_of_measure ?? 'kg',
    net_amount: initialData?.net_amount ?? 0,
    vat_amount: initialData?.vat_amount ?? 0,
    supplier_key: initialData?.supplier_key ?? (suppliers[0]?.supplier_key ?? 0),
    payment_method: initialData?.payment_method ?? 'Cash',
    invoice_number: initialData?.invoice_number ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const totalAmount = (form.net_amount || 0) + (form.vat_amount || 0);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.expense_date) e.expense_date = 'Date is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.net_amount < 0) e.net_amount = 'Must be 0 or greater';
    if (!form.supplier_key) e.supplier_key = 'Supplier is required';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        total_amount: totalAmount,
      };
      if (isEdit) {
        await updateExpense(initialData!.expense_id, payload);
        toast('Expense updated', 'success');
      } else {
        await insertExpense(payload);
        toast('Expense added', 'success');
      }
      await refresh();
      onSave();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  function setField(field: string, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Expense Date" required error={errors.expense_date}>
          <input
            type="date"
            value={form.expense_date}
            onChange={(e) => setField('expense_date', e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Invoice Number" error={errors.invoice_number}>
          <input
            type="text"
            value={form.invoice_number}
            onChange={(e) => setField('invoice_number', e.target.value)}
            placeholder="e.g. INV-001"
            className={inputClass}
          />
        </FormField>
      </div>

      <FormField label="Description" required error={errors.description}>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder="e.g. Poulet frais 10kg"
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Category" error={errors.category}>
          <select
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            className={selectClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Supplier" required error={errors.supplier_key}>
          <select
            value={form.supplier_key}
            onChange={(e) => setField('supplier_key', parseInt(e.target.value))}
            className={selectClass}
          >
            <option value={0}>Select supplier...</option>
            {suppliers.map((s) => (
              <option key={s.supplier_key} value={s.supplier_key}>{s.standard_name}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Quantity" error={errors.quantity}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.quantity ?? ''}
            onChange={(e) => setField('quantity', parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Unit" error={errors.unit_of_measure}>
          <select
            value={form.unit_of_measure ?? 'kg'}
            onChange={(e) => setField('unit_of_measure', e.target.value)}
            className={selectClass}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Payment" error={errors.payment_method}>
          <select
            value={form.payment_method}
            onChange={(e) => setField('payment_method', e.target.value)}
            className={selectClass}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Net Amount (MUR)" required error={errors.net_amount}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.net_amount}
            onChange={(e) => setField('net_amount', parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>
        <FormField label="VAT Amount (MUR)" error={errors.vat_amount}>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.vat_amount}
            onChange={(e) => setField('vat_amount', parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Computed total */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Amount</span>
        <span className="text-sm font-bold text-navy">MUR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isEdit ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </form>
  );
}
