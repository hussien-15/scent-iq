'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type ToastInput = { message: string; type?: ToastType; action?: { label: string; href: string }; duration?: number };
type ToastItem = ToastInput & { id: number; type: ToastType };

const ToastContext = createContext<{ showToast: (input: ToastInput | string) => void } | null>(null);

const icon = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const tone = {
  success: 'border-emerald-300/25 text-emerald-200',
  error: 'border-red-300/30 text-red-200',
  warning: 'border-amber-300/30 text-amber-200',
  info: 'border-studioBlue/30 text-blue-200',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const remove = useCallback((id: number) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const showToast = useCallback(
    (input: ToastInput | string) => {
      const details = typeof input === 'string' ? { message: input } : input;
      const id = ++nextId.current;
      const item: ToastItem = { ...details, id, type: details.type ?? 'success' };
      setToasts((items) => [...items.slice(-2), item]);
      window.setTimeout(() => remove(id), details.duration ?? 3800);
    },
    [remove]
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[100] flex flex-col items-end gap-2 md:bottom-6"
      >
        {toasts.map((toast) => {
          const Icon = icon[toast.type];
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={`toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-ink-soft/95 p-4 shadow-2xl backdrop-blur ${tone[toast.type]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm leading-6 text-parchment">{toast.message}</p>
              {toast.action && (
                <Link
                  href={toast.action.href}
                  onClick={() => remove(toast.id)}
                  className="shrink-0 text-xs font-medium text-gold-bright hover:text-gold"
                >
                  {toast.action.label}
                </Link>
              )}
              <button
                type="button"
                onClick={() => remove(toast.id)}
                aria-label="Close notification"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-smoke hover:bg-white/5 hover:text-parchment"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
