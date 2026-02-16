'use client';

import { type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export default function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-accent-red ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-accent-red font-medium">{error}</p>}
    </div>
  );
}

// Shared input class for consistency
export const inputClass =
  'w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder-gray-300 disabled:bg-gray-50 disabled:text-gray-400';

export const selectClass =
  'w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer';
