'use client';

import { useState } from 'react';
import type { WRRevenue } from '@/lib/supabase';
import { insertWRRevenue, updateWRRevenue } from '@/lib/mutations';
import { useDashboardData } from '@/lib/data-context';
import { useToast } from '@/components/ui/Toast';
import FormField, { inputClass } from '@/components/ui/FormField';

interface WRRevenueFormProps {
  initialData?: WRRevenue;
  onSave: () => void;
  onCancel: () => void;
}

export default function WRRevenueForm({ initialData, onSave, onCancel }: WRRevenueFormProps) {
  const { refresh } = useDashboardData();
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    revenue_date: initialData?.revenue_date ?? new Date().toISOString().split('T')[0],
    client_name: initialData?.client_name ?? 'WR',
    trip_description: initialData?.trip_description ?? '',
    amount: initialData?.amount ?? 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.revenue_date) e.revenue_date = 'Date is required';
    if (!form.client_name.trim()) e.client_name = 'Client name is required';
    if (!form.amount || form.amount <= 0) e.amount = 'Amount must be greater than 0';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (isEdit) {
        await updateWRRevenue(initialData!.staging_id, form);
        toast('WR revenue record updated', 'success');
      } else {
        await insertWRRevenue(form);
        toast('WR revenue record added', 'success');
      }
      await refresh();
      onSave();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  function setField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Revenue Date" required error={errors.revenue_date}>
        <input
          type="date"
          value={form.revenue_date}
          onChange={(e) => setField('revenue_date', e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Client Name" required error={errors.client_name}>
        <input
          type="text"
          value={form.client_name}
          onChange={(e) => setField('client_name', e.target.value)}
          placeholder="e.g. WR"
          className={inputClass}
        />
      </FormField>

      <FormField label="Trip Description" error={errors.trip_description}>
        <input
          type="text"
          value={form.trip_description}
          onChange={(e) => setField('trip_description', e.target.value)}
          placeholder="e.g. Sunset cruise - 12 pax"
          className={inputClass}
        />
      </FormField>

      <FormField label="Amount (MUR)" required error={errors.amount}>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.amount}
          onChange={(e) => setField('amount', parseFloat(e.target.value) || 0)}
          className={inputClass}
        />
      </FormField>

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
          {isEdit ? 'Update Record' : 'Save Record'}
        </button>
      </div>
    </form>
  );
}
