'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { inputClass } from '@/components/ui/FormField';

/** Simple mode: plain string suggestions */
interface SimpleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  richSuggestions?: never;
  placeholder?: string;
  className?: string;
  /** Called on blur — use to resolve aliases, etc. */
  onBlurResolve?: (value: string) => string;
}

/** Rich mode: structured suggestions with display text and resolved value */
export interface RichSuggestion {
  display: string;
  value: string;
}

interface RichAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: never;
  richSuggestions: RichSuggestion[];
  placeholder?: string;
  className?: string;
  onBlurResolve?: (value: string) => string;
}

type AutocompleteInputProps = SimpleAutocompleteProps | RichAutocompleteProps;

export default function AutocompleteInput(props: AutocompleteInputProps) {
  const { value, onChange, placeholder, className, onBlurResolve } = props;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Normalise suggestions to the rich format
  const items: RichSuggestion[] = useMemo(() => {
    if (props.richSuggestions) return props.richSuggestions;
    if (props.suggestions) return props.suggestions.map((s) => ({ display: s, value: s }));
    return [];
  }, [props.richSuggestions, props.suggestions]);

  // Filter suggestions based on current input
  const filtered = useMemo(() => {
    if (!value.trim()) return items;
    const lower = value.toLowerCase();
    return items.filter((item) => item.display.toLowerCase().includes(lower));
  }, [value, items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleBlur() {
    // Resolve alias on blur (e.g. "Phenix" → "Phoenix Beverages Limited")
    if (onBlurResolve && value.trim()) {
      const resolved = onBlurResolve(value);
      if (resolved !== value) {
        onChange(resolved);
      }
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className ?? inputClass}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          {filtered.map((item, idx) => (
            <li
              key={`${item.value}-${idx}`}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                onChange(item.value);
                setOpen(false);
              }}
              className="px-3 py-1.5 text-xs text-gray-700 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {item.display}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
