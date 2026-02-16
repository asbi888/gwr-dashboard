'use client';

import { useState } from 'react';
import type { FoodUsage } from '@/lib/supabase';
import { insertFoodUsage, updateFoodUsage } from '@/lib/mutations';
import { useDashboardData } from '@/lib/data-context';
import { useToast } from '@/components/ui/Toast';
import FormField, { inputClass } from '@/components/ui/FormField';

interface FoodUsageFormProps {
  initialData?: FoodUsage;
  onSave: () => void;
  onCancel: () => void;
}

export default function FoodUsageForm({ initialData, onSave, onCancel }: FoodUsageFormProps) {
  const { refresh } = useDashboardData();
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    usage_date: initialData?.usage_date ?? new Date().toISOString().split('T')[0],
    poulet_kg: initialData?.poulet_kg ?? 0,
    langoustes_kg: initialData?.langoustes_kg ?? 0,
    poisson_kg: initialData?.poisson_kg ?? 0,
    reserve_gambass_pcs: initialData?.reserve_gambass_pcs ?? 0,
    reserve_langoustes: initialData?.reserve_langoustes ?? 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const totalKg = (form.poulet_kg || 0) + (form.langoustes_kg || 0) + (form.poisson_kg || 0);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.usage_date) e.usage_date = 'Date is required';
    if (form.poulet_kg < 0) e.poulet_kg = 'Must be 0 or greater';
    if (form.langoustes_kg < 0) e.langoustes_kg = 'Must be 0 or greater';
    if (form.poisson_kg < 0) e.poisson_kg = 'Must be 0 or greater';
    if (form.reserve_gambass_pcs < 0) e.reserve_gambass_pcs = 'Must be 0 or greater';
    if (form.reserve_langoustes < 0) e.reserve_langoustes = 'Must be 0 or greater';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const payload = { ...form, total_kg: totalKg };
      if (isEdit) {
        await updateFoodUsage(initialData!.staging_id, payload);
        toast('Food usage record updated', 'success');
      } else {
        await insertFoodUsage(payload);
        toast('Food usage record added', 'success');
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
        <FormField label="Poulet (kg)" error={errors.poulet_kg}>
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.poulet_kg}
            onChange={(e) => setField('poulet_kg', parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Langoustes (kg)" error={errors.langoustes_kg}>
          <input
            type="number"
            step="0.1"
            min="0"
            value={form.langoustes_kg}
            onChange={(e) => setField('langoustes_kg', parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>
      </div>

      <FormField label="Poisson (kg)" error={errors.poisson_kg}>
        <input
          type="number"
          step="0.1"
          min="0"
          value={form.poisson_kg}
          onChange={(e) => setField('poisson_kg', parseFloat(e.target.value) || 0)}
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Reserve Gambas (pcs)" error={errors.reserve_gambass_pcs}>
          <input
            type="number"
            min="0"
            value={form.reserve_gambass_pcs}
            onChange={(e) => setField('reserve_gambass_pcs', parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Reserve Langoustes" error={errors.reserve_langoustes}>
          <input
            type="number"
            min="0"
            value={form.reserve_langoustes}
            onChange={(e) => setField('reserve_langoustes', parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Computed total */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total KG</span>
        <span className="text-sm font-bold text-navy">{totalKg.toFixed(1)} kg</span>
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
