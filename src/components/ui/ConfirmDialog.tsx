'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  busy = false,
  danger = false,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  danger?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && !busy && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [busy, onClose, open]);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-soft p-6 shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-red-400/10 text-red-200' : 'bg-gold/10 text-gold-bright'}`}
          >
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-title" className="font-display text-xl text-parchment">
              {title}
            </h2>
            <p id="confirm-description" className="mt-2 text-sm leading-6 text-smoke">
              {description}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-smoke hover:bg-white/5 hover:text-parchment"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-7 flex flex-row-reverse gap-3">
          <Button type="button" variant={danger ? 'danger' : 'primary'} size="sm" loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button ref={cancelRef} type="button" variant="ghost" size="sm" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
