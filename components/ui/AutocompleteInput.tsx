'use client';

import { useState, useRef, useEffect } from 'react';
import { inputClass } from '@/components/ui/FormField';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  className?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on current input
  useEffect(() => {
    if (!value.trim()) {
      setFiltered(suggestions);
    } else {
      const lower = value.toLowerCase();
      setFiltered(suggestions.filter((s) => s.toLowerCase().includes(lower)));
    }
  }, [value, suggestions]);

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
        placeholder={placeholder}
        className={className ?? inputClass}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          {filtered.map((item) => (
            <li
              key={item}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                onChange(item);
                setOpen(false);
              }}
              className="px-3 py-1.5 text-xs text-gray-700 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
