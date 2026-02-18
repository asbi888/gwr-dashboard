'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { CHART_OF_ACCOUNTS, COA_MAP } from '@/lib/chart-of-accounts';

interface AccountCellEditorProps {
  currentCode: string;
  onChangeCode: (code: string) => void;
}

export default function AccountCellEditor({ currentCode, onChangeCode }: AccountCellEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return CHART_OF_ACCOUNTS;
    const lower = search.toLowerCase();
    return CHART_OF_ACCOUNTS.filter(
      (a) => a.code.toLowerCase().includes(lower) || a.name.toLowerCase().includes(lower)
    );
  }, [search]);

  // Reset highlight when filter changes
  useEffect(() => { setHighlightIdx(0); }, [filtered]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const item = listRef.current.children[highlightIdx] as HTMLElement;
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx, isOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlightIdx]) {
      e.preventDefault();
      onChangeCode(filtered[highlightIdx].code);
      setIsOpen(false);
      setSearch('');
    }
  }

  function handleSelect(code: string) {
    onChangeCode(code);
    setIsOpen(false);
    setSearch('');
  }

  const label = COA_MAP[currentCode]?.name ?? '';
  const badgeColor = currentCode === '630000'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-blue-100 text-blue-700';

  // Closed state: show clickable badge
  if (!isOpen) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeColor} hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer`}
        title={`${currentCode} - ${label} (click to change)`}
      >
        {currentCode}
        <svg className="w-2.5 h-2.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  // Open state: search input + dropdown
  return (
    <div ref={wrapperRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search code or name..."
        className="w-44 px-2.5 py-1 rounded-lg border border-primary/40 text-[11px] text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder-gray-300"
        autoComplete="off"
      />
      <ul
        ref={listRef}
        className="absolute z-50 left-0 mt-1 w-72 max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl py-1"
        style={{ animation: 'dropdownIn 0.15s ease-out' }}
      >
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-[11px] text-gray-400">No accounts found</li>
        ) : (
          filtered.map((acct, idx) => (
            <li
              key={acct.code}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(acct.code); }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`px-3 py-1.5 text-[11px] cursor-pointer transition-colors flex items-center gap-2 ${
                idx === highlightIdx ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
              } ${acct.code === currentCode ? 'font-semibold' : ''}`}
            >
              <span className="font-mono text-[10px] w-16 shrink-0 text-gray-500">{acct.code}</span>
              <span className="truncate">{acct.name}</span>
              <span className="text-[9px] text-gray-300 shrink-0 ml-auto">{acct.type}</span>
              {acct.code === currentCode && (
                <svg className="w-3 h-3 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
