'use client';

import { useState } from 'react';
import type { DrinksUsage } from '@/lib/supabase';
import { insertDrinksUsage, updateDrinksUsage } from '@/lib/mutations';
import { useDashboardData } from '@/lib/data-context';
import { useToast } from '@/components/ui/Toast';
import FormField, { inputClass } from '@/components/ui/FormField';

interface DrinksUsageFormProps {
  initialData?: DrinksUsage;
  onSave: () => void;
  onCancel: () => void;
}

const DRINK_FIELDS = [
  { key: 'coca_cola_bottles', label: 'Coca-Cola' },
  { key: 'sprite_bottles', label: 'Sprite' },
  { key: 'beer_bottles', label: 'Beer' },
  { key: 'rhum_bottles', label: 'Rhum' },
  { key: 'rose_bottles', label: 'Rose Wine' },
  { key: 'blanc_bottles', label: 'Blanc Wine' },
] as const;

export default function DrinksUsageForm({ initialData, onSave, onCancel }: DrinksUsageFormProps) {
  const { refresh } = useDashboardData();
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    usage_date: initialData?.usage_date ?? new Date().toISOString().split('T')[0],
    coca_cola_bottles: initialData?.coca_cola_bottles ?? 0,
    sprite_bottles: initialData?.sprite_bottles ?? 0,
    beer_bottles: initialData?.beer_bottles ?? 0,
    rhum_bottles: initialData?.rhum_bottles ?? 0,
    rose_bottles: initialData?.rose_bottles ?? 0,
    blanc_bottles: initialData?.blanc_bottles ?? 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const totalBottles = DRINK_FIELDS.reduce(
    (sum, f) => sum + (form[f.key] || 0),
    0,
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!form.usage_date) e.usage_date = 'Date is required';
    DRINK_FIELDS.forEach((f) => {
      if (form[f.key] < 0)
        e[f.key] = 'Must be 0 or greater';
    });
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = { ...form, total_bottles: totalBottles };
      if (isEdit) {
        await updateDrinksUsage(initialData!.staging_id, payload);
        toast('Drinks usage record updated', 'success');
      } else {
        await insertDrinksUsage(payload);
        toast('Drinks usage record added', 'success');
      }
      await refresh();
      onSave();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  function setField(field: string, value: number | string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Usage Date" required error={errors.usage_date}>
        <input
          type="date"
          value={form.usage_date}
          onChange={(e) => setField('usage_date', e.target.value)}
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        {DRINK_FIELDS.map((f) => (
          <FormField key={f.key} label={`${f.label} (bottles)`} error={errors[f.key]}>
            <input
              type="number"
              min="0"
              value={form[f.key]}
              onChange={(e) => setField(f.key, parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </FormField>
        ))}
      </div>

      {/* Computed total */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Bottles</span>
        <span className="text-sm font-bold text-navy">{totalBottles}</span>
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
          {isEdit ? 'Update Record' : 'Save Record'}
        </button>
      </div>
    </form>
  );
}
