import { Gauge, Laptop, Smartphone, Tablet } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/authorization';

export const dynamic = 'force-dynamic';

const METRICS = ['LCP', 'CLS', 'INP', 'FCP', 'TTFB'] as const;

function p75(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.75) - 1] ?? 0;
}

function displayValue(name: string, value: number) {
  return name === 'CLS' ? value.toFixed(3) : `${Math.round(value)} ms`;
}

function target(name: string) {
  if (name === 'LCP') return '≤ 2,500 ms';
  if (name === 'CLS') return '≤ 0.10';
  if (name === 'INP') return '≤ 200 ms';
  if (name === 'FCP') return '≤ 1,800 ms';
  return '≤ 800 ms';
}

export default async function PerformancePage() {
  await requirePermission('analytics.view');
  const since = new Date(Date.now() - 7 * 86400000);
  const samples = await prisma.coreWebVital.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
    select: { name: true, value: true, rating: true, pathname: true, device: true, createdAt: true },
  });

  const summaries = METRICS.map((name) => {
    const rows = samples.filter((sample) => sample.name === name);
    return { name, count: rows.length, p75: p75(rows.map((row) => row.value)), poor: rows.filter((row) => row.rating === 'poor').length };
  });
  const routeMap = new Map<string, number[]>();
  samples.filter((sample) => ['LCP', 'INP'].includes(sample.name)).forEach((sample) => {
    const key = `${sample.pathname} · ${sample.name}`;
    routeMap.set(key, [...(routeMap.get(key) ?? []), sample.value]);
  });
  const slowRoutes = [...routeMap.entries()]
    .map(([route, values]) => ({ route, p75: p75(values), samples: values.length }))
    .sort((a, b) => b.p75 - a.p75)
    .slice(0, 12);
  const deviceRows = ['MOBILE', 'TABLET', 'DESKTOP'].map((device) => ({
    device,
    count: samples.filter((sample) => sample.device === device).length,
    lcp: p75(samples.filter((sample) => sample.device === device && sample.name === 'LCP').map((sample) => sample.value)),
  }));
  const DeviceIcon = { MOBILE: Smartphone, TABLET: Tablet, DESKTOP: Laptop } as const;

  return (
    <div className="space-y-7 pb-12">
      <header>
        <p className="eyebrow mb-2">Real users · 10% privacy-safe sample · last 7 days</p>
        <h1 className="flex items-center gap-3 font-display text-3xl text-parchment"><Gauge className="text-gold" />Performance & Core Web Vitals</h1>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-smoke">p75 is the launch decision metric: at least 75% of sampled visits should meet the target. Measurements contain routes and broad device classes only.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaries.map((summary) => (
          <article key={summary.name} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between"><strong className="text-sm text-parchment">{summary.name}</strong><span className="text-[10px] text-smoke">{summary.count} samples</span></div>
            <p className="mt-4 font-display text-2xl text-gold-bright">{summary.count ? displayValue(summary.name, summary.p75) : '—'}</p>
            <p className="mt-1 text-[10px] text-smoke">Target {target(summary.name)} · {summary.poor} poor</p>
          </article>
        ))}
      </div>

      {samples.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-8 text-center text-sm text-smoke">No sampled visits yet. Metrics begin appearing automatically after real storefront traffic.</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <section className="overflow-x-auto rounded-xl border border-white/10 p-5">
            <h2 className="font-display text-xl text-parchment">Slowest measured routes</h2>
            <table className="mt-4 w-full min-w-[560px] text-left text-xs"><thead className="text-smoke"><tr><th className="border-b border-white/10 py-2 font-normal">Route · metric</th><th className="border-b border-white/10 py-2 font-normal">p75</th><th className="border-b border-white/10 py-2 font-normal">Samples</th></tr></thead><tbody>{slowRoutes.map((row) => <tr key={row.route}><td className="border-b border-white/5 py-3 text-parchment">{row.route}</td><td className="border-b border-white/5 py-3 text-gold-bright">{Math.round(row.p75)} ms</td><td className="border-b border-white/5 py-3 text-smoke">{row.samples}</td></tr>)}</tbody></table>
          </section>
          <section className="rounded-xl border border-white/10 p-5">
            <h2 className="font-display text-xl text-parchment">LCP by device</h2>
            <div className="mt-4 space-y-3">{deviceRows.map((row) => { const Icon = DeviceIcon[row.device as keyof typeof DeviceIcon]; return <div key={row.device} className="flex items-center justify-between rounded-lg border border-white/10 p-4"><span className="flex items-center gap-2 text-xs text-smoke"><Icon size={15} />{row.device}</span><span className="text-end text-xs text-parchment">{row.lcp ? `${Math.round(row.lcp)} ms` : '—'}<small className="ms-2 text-smoke">({row.count})</small></span></div>; })}</div>
          </section>
        </div>
      )}
    </div>
  );
}
