'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSearch, Upload } from 'lucide-react';
import { processProductImport, type ProductImportActionResult } from '@/actions/product-import';

const inputClass = 'rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment file:me-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-parchment';

export default function ProductImportManager() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProductImportActionResult>({});
  const [pending, startTransition] = useTransition();

  function run(confirm: boolean) {
    if (!file) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set('file', file);
      if (confirm) formData.set('confirm', 'true');
      setResult(await processProductImport(formData));
    });
  }

  const report = result.report;
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div><p className="eyebrow mb-2">Two-step quality gate</p><h2 className="font-display text-xl text-parchment">Validate before saving</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-smoke">Upload CSV, JSON, or Excel XML (.xls). ScentIQ matches brands, categories, notes, tags, and media, then blocks duplicate or invalid rows. Nothing is written during preview.</p></div>
          <a href="/api/studio/products/import-template" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-gold/30 px-4 py-2.5 text-xs text-gold-bright"><Download size={14} />Download CSV template</a>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,.json,.xls,text/csv,application/json,application/vnd.ms-excel" className={inputClass} onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult({}); }} />
          <button type="button" disabled={!file || pending} onClick={() => run(false)} className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2.5 text-xs font-medium text-ink disabled:opacity-40"><FileSearch size={14} />{pending ? 'Checking…' : 'Preview validation'}</button>
          <span className="text-[10px] text-smoke">Maximum 5 MB · 1,000 rows</span>
        </div>
        {result.error && <p className="mt-4 rounded-md border border-red-300/20 bg-red-300/[0.04] p-3 text-xs text-red-200">{result.error}</p>}
        {result.imported != null && <p className="mt-4 rounded-md border border-emerald-300/20 bg-emerald-300/[0.04] p-3 text-xs text-emerald-200">Imported {result.imported} product(s). Draft and review status rules were applied automatically.</p>}
      </section>

      {report && <>
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['Rows', report.totalRows], ['Ready', report.validRows], ['Error rows', report.errorRows], ['Warnings', report.warningRows], ['Duplicates', report.duplicateRows],
          ].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 p-4"><p className="font-display text-2xl text-parchment">{value}</p><p className="mt-1 text-[10px] text-smoke">{label}</p></div>)}
        </section>

        <section className="overflow-hidden rounded-xl border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div><h2 className="text-sm text-parchment">Validation rows</h2><p className="mt-1 text-[10px] text-smoke">Errors must be fixed in the source file. Warnings are review items and do not silently create taxonomy.</p></div><button type="button" disabled={pending || report.errorRows > 0 || report.totalRows === 0} onClick={() => run(true)} className="inline-flex items-center gap-2 rounded-md bg-emerald-300 px-4 py-2.5 text-xs font-medium text-ink disabled:cursor-not-allowed disabled:opacity-35"><Upload size={14} />{pending ? 'Revalidating…' : `Import ${report.validRows} product(s)`}</button></div>
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[920px] text-left text-xs"><thead className="sticky top-0 bg-ink-soft text-smoke"><tr>{['Row', 'Product', 'Brand / category', 'SKU / slug', 'Completion', 'Result'].map((label) => <th key={label} className="p-3 font-normal">{label}</th>)}</tr></thead><tbody>{report.rows.map((row) => {
              const errors = row.issues.filter((issue) => issue.severity === 'error');
              const warnings = row.issues.filter((issue) => issue.severity === 'warning');
              return <tr key={row.rowNumber} className="border-t border-white/5 align-top"><td className="p-3 text-smoke">{row.rowNumber}</td><td className="p-3"><p className="text-parchment">{row.values.NameEnglish || 'Missing name'}</p><p className="mt-1 text-smoke" dir="rtl">{row.values.NameArabic}</p></td><td className="p-3 text-smoke">{row.values.Brand || '—'}<br />{row.values.Category || '—'}</td><td className="p-3 text-smoke">{row.sku}<br />/{row.slug}</td><td className="p-3"><span className={row.completionScore >= 80 ? 'text-emerald-300' : 'text-amber-200'}>{row.completionScore}%</span><p className="mt-1 text-[9px] text-smoke">{row.effectiveStatus.replaceAll('_', ' ')}</p></td><td className="p-3"><div className="space-y-1">{errors.map((issue, index) => <p key={`e-${index}`} className="flex items-start gap-1 text-[10px] text-red-200"><AlertTriangle size={11} className="mt-0.5 shrink-0" />{issue.field}: {issue.message}</p>)}{warnings.map((issue, index) => <p key={`w-${index}`} className="flex items-start gap-1 text-[10px] text-amber-100"><AlertTriangle size={11} className="mt-0.5 shrink-0" />{issue.field}: {issue.message}</p>)}{!row.issues.length && <p className="flex items-center gap-1 text-[10px] text-emerald-300"><CheckCircle2 size={11} />Ready</p>}</div></td></tr>;
            })}</tbody></table>
          </div>
        </section>
      </>}
    </div>
  );
}
