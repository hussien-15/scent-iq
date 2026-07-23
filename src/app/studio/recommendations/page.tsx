import Link from 'next/link';
import { Brain, Eye, MousePointerClick, PackageSearch, SlidersHorizontal } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSimilarityWeights } from '@/services/similarity.service';

export const dynamic = 'force-dynamic';

const labels: Record<string, string> = {
  notes: 'Shared notes',
  family: 'Fragrance family',
  brand: 'Brand relationship',
  occasion: 'Occasion',
  season: 'Season',
  style: 'Style',
  mood: 'Mood',
  gender: 'Gender',
  price: 'Price proximity',
  performance: 'Performance profile',
};

export default async function StudioRecommendationsPage() {
  const [weights, products, relationships, impressions, clicks] = await Promise.all([
    getSimilarityWeights(),
    prisma.perfume.count({ where: { status: 'PUBLISHED', availability: { not: 'HIDDEN' } } }),
    prisma.brandSimilarity.count(),
    prisma.analyticsEvent.count({ where: { eventType: 'RECOMMENDATION_IMPRESSION' } }),
    prisma.analyticsEvent.count({ where: { eventType: 'RECOMMENDATION_CLICK' } }),
  ]);
  const maximum = Math.max(...Object.values(weights));
  const clickRate = impressions > 0 ? (clicks / impressions) * 100 : 0;

  return (
    <div className="space-y-7 pb-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Explainable, first-party discovery</p>
          <h1 className="font-display text-3xl text-parchment">Recommendation Engine</h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-smoke">
            Recommendations compare real catalog attributes. Customer-facing explanations remain simple and never expose
            scores or technical weights.
          </p>
        </div>
        <Link
          href="/studio/settings"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold/35 px-5 text-xs text-gold-bright"
        >
          <SlidersHorizontal size={14} />
          Open stored settings
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: PackageSearch, label: 'Eligible products', value: products },
          { icon: Brain, label: 'Brand relationships', value: relationships },
          { icon: Eye, label: 'Recorded impressions', value: impressions },
          { icon: MousePointerClick, label: 'Click rate', value: `${clickRate.toFixed(1)}%` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <Icon size={17} className="text-gold" />
            <p className="mt-4 font-display text-2xl text-parchment">{value}</p>
            <p className="mt-1 text-xs text-smoke">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-white/10 p-5">
        <div className="mb-5">
          <h2 className="font-display text-xl text-parchment">Similarity priorities</h2>
          <p className="mt-1 text-xs text-smoke">
            The relative influence currently loaded by the recommendation service.
          </p>
        </div>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {Object.entries(weights)
            .sort(([, a], [, b]) => b - a)
            .map(([key, value]) => (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-parchment">{labels[key] ?? key}</span>
                  <span className="text-smoke">{Math.round(value * 1000) / 10}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-studioBlue"
                    style={{ width: `${maximum ? (value / maximum) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
        </div>
      </section>

      {products < 2 && (
        <section className="rounded-xl border border-amber-300/20 bg-amber-300/[0.03] p-4 text-xs leading-5 text-smoke">
          <strong className="text-amber-100">More catalog data is needed.</strong> Publish at least two complete
          products before expecting related-fragrance recommendations.
        </section>
      )}
    </div>
  );
}
