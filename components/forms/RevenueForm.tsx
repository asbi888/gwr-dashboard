'use client';

import { useState } from 'react';
import type { Revenue, RevenueLine } from '@/lib/supabase';
import { insertRevenue, updateRevenue, insertRevenueLine, updateRevenueLine, deleteRevenueLine } from '@/lib/mutations';
import { useDashboardData } from '@/lib/data-context';
import { useToast } from '@/components/ui/Toast';
import FormField, { inputClass } from '@/components/ui/FormField';

interface LineItem {
  localId: string;
  line_id?: string; // exists if editing an existing line
  menu_item: string;
  quantity: number;
  unit_price: number;
}

interface RevenueFormProps {
  initialData?: Revenue;
  initialLines?: RevenueLine[];
  onSave: () => void;
  onCancel: () => void;
}

export default function RevenueForm({ initialData, initialLines, onSave, onCancel }: RevenueFormProps) {
  const { refresh } = useDashboardData();
  const { toast } = useToast();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    revenue_date: initialData?.revenue_date ?? new Date().toISOString().split('T')[0],
    client_name: initialData?.client_name ?? '',
    pax_count: initialData?.pax_count ?? 1,
  });

  const [lines, setLines] = useState<LineItem[]>(
    initialLines?.map((l) => ({
      localId: l.line_id,
      line_id: l.line_id,
      menu_item: l.menu_item,
      quantity: l.quantity,
      unit_price: l.unit_price,
    })) ?? [{ localId: crypto.randomUUID(), menu_item: '', quantity: 1, unit_price: 0 }],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const totalRevenue = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.revenue_date) e.revenue_date = 'Date is required';
    if (!form.client_name.trim()) e.client_name = 'Client name is required';
    if (form.pax_count < 1) e.pax_count = 'Pax must be at least 1';
    if (lines.length === 0) e.lines = 'At least one line item is required';
    lines.forEach((l, i) => {
      if (!l.menu_item.trim()) e[`line_${i}_item`] = 'Required';
      if (l.quantity <= 0) e[`line_${i}_qty`] = 'Must be > 0';
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
      if (isEdit) {
        // Update header
        await updateRevenue(initialData!.revenue_id, {
          ...form,
          total_revenue: totalRevenue,
        });

        // Handle line changes: update existing, add new, delete removed
        const existingLineIds = new Set(initialLines?.map((l) => l.line_id) ?? []);
        const currentLineIds = new Set(lines.filter((l) => l.line_id).map((l) => l.line_id!));

        // Delete removed lines
        for (const lid of existingLineIds) {
          if (!currentLineIds.has(lid)) {
            await deleteRevenueLine(lid);
          }
        }

        // Update or insert lines
        for (const line of lines) {
          if (line.line_id && existingLineIds.has(line.line_id)) {
            await updateRevenueLine(line.line_id, {
              menu_item: line.menu_item,
              quantity: line.quantity,
              unit_price: line.unit_price,
            });
          } else {
            await insertRevenueLine({
              revenue_id: initialData!.revenue_id,
              menu_item: line.menu_item,
              quantity: line.quantity,
              unit_price: line.unit_price,
              line_total: line.quantity * line.unit_price,
            });
          }
        }

        toast('Revenue order updated', 'success');
      } else {
        await insertRevenue(
          { ...form, total_revenue: totalRevenue },
          lines.map((l) => ({
            menu_item: l.menu_item,
            quantity: l.quantity,
            unit_price: l.unit_price,
            line_total: l.quantity * l.unit_price,
          })),
        );
        toast('Revenue order added', 'success');
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

  function updateLine(localId: string, field: keyof LineItem, value: string | number) {
    setLines((prev) =>
      prev.map((l) => (l.localId === localId ? { ...l, [field]: value } : l)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { localId: crypto.randomUUID(), menu_item: '', quantity: 1, unit_price: 0 }]);
  }

  function removeLine(localId: string) {
    setLines((prev) => prev.filter((l) => l.localId !== localId));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
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
            placeholder="e.g. ANAHITA"
            className={inputClass}
          />
        </FormField>
        <FormField label="Pax Count" required error={errors.pax_count}>
          <input
            type="number"
            min="1"
            value={form.pax_count}
            onChange={(e) => setField('pax_count', parseInt(e.target.value) || 1)}
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Line Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Line Items
          </span>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Line
          </button>
        </div>

        {errors.lines && (
          <p className="text-[10px] text-accent-red font-medium">{errors.lines}</p>
        )}

        {lines.map((line, i) => (
          <div key={line.localId} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
            <div className="flex-[3] min-w-0">
              <input
                type="text"
                value={line.menu_item}
                onChange={(e) => updateLine(line.localId, 'menu_item', e.target.value)}
                placeholder="Menu item"
                className={`${inputClass} ${errors[`line_${i}_item`] ? 'border-accent-red' : ''}`}
              />
            </div>
            <div className="flex-[1]">
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(e) => updateLine(line.localId, 'quantity', parseInt(e.target.value) || 0)}
                placeholder="Qty"
                className={`${inputClass} ${errors[`line_${i}_qty`] ? 'border-accent-red' : ''}`}
              />
            </div>
            <div className="flex-[1.5]">
              <input
                type="number"
                step="0.01"
                min="0"
                value={line.unit_price}
                onChange={(e) => updateLine(line.localId, 'unit_price', parseFloat(e.target.value) || 0)}
                placeholder="Price"
                className={inputClass}
              />
            </div>
            <div className="flex-[1] text-right">
              <p className="text-xs font-semibold text-navy pt-2">
                {(line.quantity * line.unit_price).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeLine(line.localId)}
              disabled={lines.length <= 1}
              className="mt-1.5 text-gray-400 hover:text-accent-red transition-colors disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</span>
        <span className="text-sm font-bold text-navy">
          MUR {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
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
          {isEdit ? 'Update Order' : 'Save Order'}
        </button>
      </div>
    </form>
  );
}
