'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

const TYPE_STYLES: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'border-l-success', icon: 'text-success', bg: 'bg-success/10' },
  error: { border: 'border-l-accent-red', icon: 'text-accent-red', bg: 'bg-accent-red/10' },
  info: { border: 'border-l-primary', icon: 'text-primary', bg: 'bg-primary/10' },
};

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev.slice(-2), { id, message, type, exiting: false }]);

    // Start exit animation after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    }, 3500);

    // Remove after exit animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => {
            const styles = TYPE_STYLES[t.type];
            return (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-xl border border-gray-100 border-l-4 ${styles.border} min-w-[280px] max-w-[380px]`}
                style={{
                  animation: t.exiting ? 'toastOut 0.3s ease-in forwards' : 'toastIn 0.3s ease-out',
                }}
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${styles.bg} ${styles.icon} shrink-0`}>
                  {ICONS[t.type]}
                </div>
                <p className="text-xs font-medium text-navy flex-1">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
