import Link from 'next/link';
import { CheckCircle2, Circle, ExternalLink, Rocket, ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import SetupControls from '@/components/studio/SetupControls';
import { parseStoreLaunch, readObject } from '@/services/store-setup.service';
import { getLaunchReadiness } from '@/services/qa.service';

export const dynamic = 'force-dynamic';

export default async function StudioSetupPage() {
  const [
    settings,
    products,
    productsWithApprovedMedia,
    activeDelivery,
    homepageSections,
    seoTemplates,
    orders,
    inventoryProducts,
    approvedMedia,
    readiness,
  ] = await Promise.all([
    prisma.siteSetting.findMany({
      where: { key: { in: ['site.identity', 'site.languages', 'commerce.currency', 'store.launch'] } },
    }),
    prisma.perfume.count(),
    prisma.perfume.count({
      where: {
        OR: [
          { mainImage: { folder: { not: 'seed-placeholders' } } },
          { media: { some: { folder: { not: 'seed-placeholders' } } } },
        ],
      },
    }),
    prisma.deliveryCompany.count({ where: { status: 'ACTIVE', fees: { some: {} } } }),
    prisma.homepageSection.count({ where: { enabled: true } }),
    prisma.seoTemplate.count(),
    prisma.order.count(),
    prisma.perfume.count({ where: { inventoryMovements: { some: {} } } }),
    prisma.media.count({ where: { folder: { not: 'seed-placeholders' }, type: { in: ['LOGO', 'BANNER', 'IMAGE'] } } }),
    getLaunchReadiness(),
  ]);
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  const identity = readObject(map.get('site.identity'));
  const languages = readObject(map.get('site.languages'));
  const currency = readObject(map.get('commerce.currency'));
  const launchStatus = parseStoreLaunch(map.get('store.launch'));
  const checklist = [
    { label: 'Upload ScentIQ logo and approved brand assets', done: approvedMedia > 0, href: '/studio/media' },
    { label: 'Add a real delivery company and verify its fees', done: activeDelivery > 0, href: '/studio/delivery' },
    { label: 'Create or import the first real products', done: products > 0, href: '/studio/products/import' },
    {
      label: 'Attach approved product images',
      done: products > 0 && productsWithApprovedMedia === products,
      href: '/studio/media',
    },
    { label: 'Review homepage sections', done: homepageSections >= 10, href: '/studio/settings' },
    { label: 'Review all SEO templates', done: seoTemplates >= 5, href: '/studio/seo?type=templates' },
    {
      label: 'Confirm store identity, currency, and languages',
      done: Boolean(identity.name && currency.code && languages.primary),
      href: '#controls',
    },
    { label: 'Test checkout and order creation', done: orders > 0, href: '/en/checkout' },
    {
      label: 'Verify initial inventory movements',
      done: products > 0 && inventoryProducts === products,
      href: '/studio/inventory',
    },
    {
      label: 'Complete Final QA, resolve blockers, and collect all approvals',
      done: readiness.ready,
      href: '/studio/qa',
    },
    { label: 'Publish the storefront only after final review', done: launchStatus === 'LIVE', href: '#controls' },
  ];
  const completed = checklist.filter((item) => item.done).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Welcome to Perfume Studio</p>
          <h1 className="font-display text-3xl text-parchment">Let’s prepare ScentIQ for launch</h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-smoke">
            Complete the essentials below with real business data. You can leave and return at any time; your progress
            is saved.
          </p>
        </div>
        <div
          className={`rounded-full border px-4 py-2 text-xs ${launchStatus === 'LIVE' ? 'border-emerald-300/30 text-emerald-300' : 'border-gold/30 text-gold-bright'}`}
        >
          <Rocket size={13} className="me-2 inline" />
          {launchStatus} MODE
        </div>
      </div>
      <section className="rounded-xl border border-white/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-parchment">Launch checklist</h2>
            <p className="mt-1 text-xs text-smoke">
              {completed} of {checklist.length} complete
            </p>
          </div>
          <div className="font-display text-3xl text-gold-bright">
            {Math.round((completed / checklist.length) * 100)}%
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${(completed / checklist.length) * 100}%` }}
          />
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {checklist.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.015] p-3 hover:border-gold/25"
            >
              {item.done ? (
                <CheckCircle2 size={17} className="shrink-0 text-emerald-300" />
              ) : (
                <Circle size={17} className="shrink-0 text-smoke" />
              )}
              <span className={item.done ? 'text-xs text-parchment' : 'text-xs text-smoke'}>
                {index + 1}. {item.label}
              </span>
              <ExternalLink size={11} className="ms-auto shrink-0 text-smoke" />
            </Link>
          ))}
        </div>
      </section>
      <div id="controls">
        <SetupControls
          defaults={{
            name: String(identity.name ?? 'ScentIQ'),
            tagline: String(identity.tagline ?? 'Your scent, powered by IQ.'),
            currency: String(currency.code ?? 'IQD'),
            primaryLanguage: String(languages.primary ?? 'ar'),
            launchStatus,
          }}
        />
      </div>
      <section className="flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/[0.03] p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold" />
        <div>
          <h2 className="text-sm text-parchment">Production safety is enforced</h2>
          <p className="mt-1 text-xs leading-5 text-smoke">
            Live Mode requires real published products, approved media, verified delivery fees, complete SEO templates,
            a Final QA score of at least 90%, 100% across critical systems, no unresolved Critical/High defects, and all
            eight accountable approvals. Setup and Preview remain non-indexable.
          </p>
        </div>
      </section>
    </div>
  );
}
