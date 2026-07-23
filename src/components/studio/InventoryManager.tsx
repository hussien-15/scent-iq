'use client';

/* eslint-disable @next/next/no-html-link-for-pages -- File export endpoints require native browser navigation. */

import Image from 'next/image';
import { FormEvent, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Archive, Boxes, CheckSquare, ChevronDown, Download, EyeOff, History, PackagePlus, Settings2, SlidersHorizontal, Upload, XCircle } from 'lucide-react';
import {
  adjustInventory,
  bulkInventoryAction,
  createProductVariant,
  importInventory,
  setInventoryAvailability,
  setVariantAvailability,
  updateInventorySettings,
  type InventoryImportState,
} from '@/actions/inventory';

type Variant = {
  id: string; name: string; bottleSize: string | null; sku: string; barcode: string | null;
  price: number; costPrice: number | null; stock: number; reservedStock: number; available: number;
  lowStockThreshold: number; availability: string; status: string; warehouseLocation: string | null;
};

export type InventoryProduct = {
  id: string; nameEn: string; nameAr: string; slug: string; sku: string; barcode: string | null;
  bottleSize: string | null; warehouseLocation: string | null; stock: number; reservedStock: number;
  available: number; lowStockThreshold: number; availability: string; status: string; updatedAt: string;
  price: number; costPrice: number | null; brand: string; category: string | null; image: string | null;
  variants: Variant[];
  movements: {
    id: string; movementType: string; quantityChanged: number; previousStock: number; newStock: number;
    previousReserved: number; newReserved: number; reason: string; adminNote: string | null;
    createdAt: string; adminName: string | null; orderId: string | null; variantName: string | null;
  }[];
};

const inputClass = 'rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment placeholder:text-smoke focus:border-gold/40 focus:outline-none';

function ImportButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-parchment disabled:opacity-40"><Upload size={13} />{pending ? 'Importing…' : 'Import inventory'}</button>;
}

function ImportPanel() {
  const initialState: InventoryImportState = {};
  const [state, action] = useFormState(importInventory, initialState);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-3">
      <input name="file" type="file" required accept=".csv,.json,.xls,.xml,text/csv,application/json" className="max-w-xs text-xs text-smoke file:me-2 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-parchment" />
      <ImportButton />
      <span className="text-[10px] text-smoke">CSV, JSON, or ScentIQ Excel export · max 5 MB</span>
      {state.success != null && <span className="text-[11px] text-emerald-300">Updated {state.success} products.</span>}
      {state.error && <span className="text-[11px] text-red-200">{state.error}</span>}
    </form>
  );
}

function StockBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    IN_STOCK: 'border-emerald-300/20 bg-emerald-300/5 text-emerald-300',
    LOW_STOCK: 'border-amber-300/20 bg-amber-300/5 text-amber-200',
    OUT_OF_STOCK: 'border-red-300/20 bg-red-300/5 text-red-200',
    RESERVED: 'border-studioBlue/30 bg-studioBlue/5 text-studioBlue',
    HIDDEN: 'border-white/10 text-smoke', DISCONTINUED: 'border-white/10 text-smoke line-through',
  };
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] ${colors[status] ?? colors.HIDDEN}`}>{status.replaceAll('_', ' ')}</span>;
}

function ProductControls({ product }: { product: InventoryProduct }) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function run(task: () => Promise<unknown>) {
    setError(''); setMessage('');
    startTransition(async () => {
      try { await task(); setMessage('Saved'); }
      catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not update inventory'); }
    });
  }

  function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const target = String(data.get('target') ?? '');
    run(() => adjustInventory({
      perfumeId: product.id, variantId: target || undefined,
      type: String(data.get('type')) as 'ADD' | 'REDUCE' | 'CORRECT' | 'DAMAGED' | 'MISSING' | 'RETURN' | 'INITIAL',
      quantity: Number(data.get('quantity')), reason: String(data.get('reason')), adminNote: String(data.get('adminNote')),
    }));
  }

  function submitVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(() => createProductVariant({
      perfumeId: product.id, name: String(data.get('name')), bottleSize: String(data.get('bottleSize') ?? ''),
      sku: String(data.get('sku')), barcode: String(data.get('barcode') ?? ''), price: Number(data.get('price')),
      costPrice: data.get('costPrice') ? Number(data.get('costPrice')) : undefined,
      stock: Number(data.get('stock')), lowStockThreshold: Number(data.get('lowStockThreshold')),
      warehouseLocation: String(data.get('warehouseLocation') ?? ''),
    }));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button disabled={isPending} onClick={() => run(() => setInventoryAvailability(product.id, 'OUT_OF_STOCK'))} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-smoke hover:text-parchment"><XCircle size={12} className="me-1 inline" />Out of stock</button>
        <button disabled={isPending} onClick={() => run(() => setInventoryAvailability(product.id, 'HIDDEN'))} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-smoke hover:text-parchment"><EyeOff size={12} className="me-1 inline" />Hide</button>
        <button disabled={isPending} onClick={() => run(() => setInventoryAvailability(product.id, 'DISCONTINUED'))} className="rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] text-smoke hover:text-parchment"><Archive size={12} className="me-1 inline" />Discontinue</button>
        <button disabled={isPending} onClick={() => run(() => setInventoryAvailability(product.id, 'IN_STOCK'))} className="rounded-md border border-emerald-300/20 px-2.5 py-1.5 text-[10px] text-emerald-300"><CheckSquare size={12} className="me-1 inline" />Sell</button>
      </div>

      <details className="group rounded-md border border-white/10">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-parchment"><span className="flex items-center gap-2"><SlidersHorizontal size={13} />Adjust stock</span><ChevronDown size={13} className="transition-transform group-open:rotate-180" /></summary>
        <form onSubmit={submitAdjustment} className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <select name="target" className={inputClass}><option value="">Main product · {product.sku}</option>{product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} · {variant.sku}</option>)}</select>
          <select name="type" className={inputClass}>{['ADD', 'REDUCE', 'CORRECT', 'DAMAGED', 'MISSING', 'RETURN', 'INITIAL'].map((type) => <option key={type}>{type}</option>)}</select>
          <input name="quantity" type="number" min="0" required placeholder="Quantity" className={inputClass} />
          <input name="reason" required minLength={3} placeholder="Reason (required)" className={inputClass} />
          <input name="adminNote" required minLength={3} placeholder="Admin note (required)" className={inputClass} />
          <button disabled={isPending} className="rounded-md bg-gold px-3 py-2 text-xs font-medium text-ink">{isPending ? 'Saving…' : 'Apply adjustment'}</button>
        </form>
      </details>

      <details className="group rounded-md border border-white/10">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-parchment"><span className="flex items-center gap-2"><Settings2 size={13} />Limits & location</span><ChevronDown size={13} className="transition-transform group-open:rotate-180" /></summary>
        <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); run(() => updateInventorySettings({ perfumeId: product.id, lowStockThreshold: Number(data.get('limit')), warehouseLocation: String(data.get('location') ?? '') })); }} className="flex flex-wrap gap-2 border-t border-white/10 p-3">
          <input name="limit" type="number" min="0" defaultValue={product.lowStockThreshold} className={inputClass} aria-label="Low stock limit" />
          <input name="location" defaultValue={product.warehouseLocation ?? ''} placeholder="Warehouse location" className={`${inputClass} flex-1`} />
          <button disabled={isPending} className="rounded-md border border-studioBlue/30 px-3 py-2 text-xs text-studioBlue">Save</button>
        </form>
      </details>

      <details className="group rounded-md border border-white/10">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-parchment"><span className="flex items-center gap-2"><PackagePlus size={13} />Variants ({product.variants.length})</span><ChevronDown size={13} className="transition-transform group-open:rotate-180" /></summary>
        <div className="space-y-3 border-t border-white/10 p-3">
          {product.variants.map((variant) => <div key={variant.id} className="flex flex-wrap items-center gap-3 rounded-md bg-white/[0.03] p-3 text-[11px] text-smoke"><strong className="text-parchment">{variant.name}</strong><span>{variant.bottleSize}</span><span>{variant.sku}</span><span>{variant.available} available / {variant.reservedStock} reserved</span><StockBadge status={variant.status} /><button onClick={() => run(() => setVariantAvailability(variant.id, variant.availability === 'HIDDEN' ? 'IN_STOCK' : 'HIDDEN'))} className="ms-auto text-gold-bright">{variant.availability === 'HIDDEN' ? 'Show' : 'Hide'}</button></div>)}
          <form onSubmit={submitVariant} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input name="name" required placeholder="Variant name" className={inputClass} /><input name="bottleSize" placeholder="Size e.g. 100ml" className={inputClass} />
            <input name="sku" required placeholder="Unique SKU" className={inputClass} /><input name="barcode" placeholder="Barcode optional" className={inputClass} />
            <input name="price" type="number" step="0.01" min="0" required placeholder="Selling price" className={inputClass} /><input name="costPrice" type="number" step="0.01" min="0" placeholder="Cost price" className={inputClass} />
            <input name="stock" type="number" min="0" required placeholder="Initial stock" className={inputClass} /><input name="lowStockThreshold" type="number" min="0" defaultValue="5" required placeholder="Low limit" className={inputClass} />
            <input name="warehouseLocation" placeholder="Warehouse location" className={inputClass} /><button disabled={isPending} className="rounded-md border border-gold/30 px-3 py-2 text-xs text-gold-bright">Add variant</button>
          </form>
        </div>
      </details>

      {message && <p className="text-[11px] text-emerald-300">{message}</p>}
      {error && <p className="text-[11px] text-red-200">{error}</p>}
    </div>
  );
}

export default function InventoryManager({ products }: { products: InventoryProduct[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [bulkMessage, setBulkMessage] = useState('');

  function submitBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBulkMessage('');
    startTransition(async () => {
      try {
        await bulkInventoryAction({ perfumeIds: [...selected], action: String(data.get('action')) as 'ADD', value: Number(data.get('value') ?? 0), note: String(data.get('note') ?? '') });
        setBulkMessage('Bulk update saved.'); setSelected(new Set());
      } catch (caught) { setBulkMessage(caught instanceof Error ? caught.message : 'Bulk update failed'); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ImportPanel />
        <div className="flex flex-wrap gap-2">
          <a href="/api/studio/inventory/export?format=csv" className="flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-smoke"><Download size={13} />CSV</a>
          <a href="/api/studio/inventory/export?format=excel" className="flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-smoke"><Download size={13} />Excel</a>
          <a href="/api/studio/inventory/export?format=json" className="flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-smoke"><Download size={13} />JSON</a>
        </div>
      </div>

      {selected.size > 0 && <form onSubmit={submitBulk} className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-gold/30 bg-ink-soft p-3 shadow-xl"><Boxes size={14} className="text-gold" /><span className="text-xs text-parchment">{selected.size} selected</span><select name="action" className={inputClass}>{['ADD', 'REDUCE', 'LOW_LIMIT', 'OUT_OF_STOCK', 'HIDDEN', 'IN_STOCK', 'DISCONTINUED', 'PRICE_PERCENT'].map((value) => <option key={value}>{value}</option>)}</select><input name="value" type="number" step="0.01" defaultValue="0" className={`${inputClass} w-28`} /><input name="note" required minLength={3} placeholder="Audit note" className={`${inputClass} min-w-56 flex-1`} /><button disabled={isPending} className="rounded-md bg-gold px-3 py-2 text-xs text-ink">{isPending ? 'Updating…' : 'Apply bulk action'}</button>{bulkMessage && <span className="text-[11px] text-smoke">{bulkMessage}</span>}</form>}

      <div className="space-y-4">
        {products.map((product) => (
          <article key={product.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <input type="checkbox" checked={selected.has(product.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(product.id); else next.delete(product.id); return next; })} className="mt-1 accent-gold" aria-label={`Select ${product.nameEn}`} />
              <div className="flex min-w-0 flex-1 gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-white/5">{product.image ? <Image src={product.image} alt="" fill quality={60} sizes="64px" className="object-cover" /> : null}</div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg text-parchment">{product.nameEn}</h2><StockBadge status={product.status} /></div><p className="mt-1 text-xs text-smoke">{product.brand} · {product.sku}{product.barcode ? ` · ${product.barcode}` : ''}</p><p className="mt-1 text-[10px] text-smoke">{product.bottleSize ?? 'No size'} · {product.warehouseLocation ?? 'No warehouse location'} · Updated {new Date(product.updatedAt).toLocaleDateString('en-IQ')}</p></div>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center lg:w-[430px]">
                {[['Physical', product.stock], ['Reserved', product.reservedStock], ['Available', product.available], ['Low limit', product.lowStockThreshold]].map(([label, value]) => <div key={label} className="rounded-md bg-white/[0.03] px-2 py-3"><p className="font-display text-lg text-parchment">{value}</p><p className="text-[9px] text-smoke">{label}</p></div>)}
              </div>
            </div>
            <div className="mt-4 border-t border-white/10 pt-4"><ProductControls product={product} /></div>
            <details className="group mt-3 rounded-md border border-white/10"><summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-smoke"><span className="flex items-center gap-2"><History size={13} />Stock history</span><ChevronDown size={13} className="transition-transform group-open:rotate-180" /></summary><div className="overflow-x-auto border-t border-white/10"><table className="w-full min-w-[760px] text-[10px]"><thead className="text-smoke"><tr>{['Date', 'Movement', 'Target', 'Physical', 'Reserved', 'Change', 'Admin', 'Reason', 'Order'].map((label) => <th key={label} className="p-2 text-start font-normal">{label}</th>)}</tr></thead><tbody>{product.movements.map((movement) => <tr key={movement.id} className="border-t border-white/5"><td className="p-2 text-smoke">{new Date(movement.createdAt).toLocaleString('en-IQ')}</td><td className="p-2 text-parchment">{movement.movementType.replaceAll('_', ' ')}</td><td className="p-2 text-smoke">{movement.variantName ?? 'Main'}</td><td className="p-2 text-smoke">{movement.previousStock} → {movement.newStock}</td><td className="p-2 text-smoke">{movement.previousReserved} → {movement.newReserved}</td><td className={movement.quantityChanged < 0 ? 'p-2 text-red-200' : 'p-2 text-emerald-300'}>{movement.quantityChanged > 0 ? '+' : ''}{movement.quantityChanged}</td><td className="p-2 text-smoke">{movement.adminName ?? 'System'}</td><td className="max-w-60 p-2 text-smoke">{movement.reason}{movement.adminNote ? ` · ${movement.adminNote}` : ''}</td><td className="p-2 text-smoke">{movement.orderId ? `#${movement.orderId.slice(0, 8).toUpperCase()}` : '—'}</td></tr>)}</tbody></table>{product.movements.length === 0 && <p className="p-4 text-xs text-smoke">No movements recorded yet.</p>}</div></details>
          </article>
        ))}
      </div>
    </div>
  );
}
