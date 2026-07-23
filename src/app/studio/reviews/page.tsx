import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { BarChart3, Eye, MessageSquare, PackageSearch, Star } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import ReviewModerationButtons from '@/components/studio/ReviewModerationButtons';
import StudioPagination from '@/components/studio/StudioPagination';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'REPORTED'] as const;

function average(values: (number | null)[]) {
  const valid = values.filter((value): value is number => value != null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
}

export default async function StudioReviewsPage(
  props: {
    searchParams: Promise<{ q?: string; product?: string; rating?: string; status?: string; page?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const status = statuses.includes(searchParams.status as (typeof statuses)[number])
    ? (searchParams.status as (typeof statuses)[number])
    : undefined;
  const rating = Number(searchParams.rating);
  const where: Prisma.ReviewWhereInput = {
    ...(status ? { approvalStatus: status } : {}),
    ...(Number.isInteger(rating) && rating >= 1 && rating <= 5 ? { rating } : {}),
    ...(searchParams.product ? { perfumeId: searchParams.product } : {}),
    ...(searchParams.q
      ? {
          OR: [
            { reviewerName: { contains: searchParams.q, mode: 'insensitive' } },
            { comment: { contains: searchParams.q, mode: 'insensitive' } },
            { perfume: { nameEn: { contains: searchParams.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
  const pageSize = 20;
  const requestedPage = Math.max(1, Number.parseInt(searchParams.page ?? '1', 10) || 1);
  const reviewsTotal = await prisma.review.count({ where });
  const totalPages = Math.max(1, Math.ceil(reviewsTotal / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const [reviews, allReviews, perfumes, perfumeNotes] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: [{ approvalStatus: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
        perfume: { select: { id: true, nameEn: true, slug: true, viewCount: true } },
        images: { select: { id: true, url: true, approvalStatus: true } },
      },
    }),
    prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        perfumeId: true,
        rating: true,
        longevityRating: true,
        projectionRating: true,
        deliveryRating: true,
        comment: true,
        helpfulYes: true,
        approvalStatus: true,
        createdAt: true,
        perfume: { select: { nameEn: true, viewCount: true } },
      },
    }),
    prisma.perfume.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, nameEn: true, viewCount: true },
      orderBy: { nameEn: 'asc' },
      take: 500,
    }),
    prisma.note.findMany({ select: { nameEn: true, nameAr: true } }),
  ]);

  const approved = allReviews.filter((review) => review.approvalStatus === 'APPROVED');
  const counts = new Map<string, { name: string; ratings: number[]; projection: number[] }>();
  approved.forEach((review) => {
    const current = counts.get(review.perfumeId) ?? { name: review.perfume.nameEn, ratings: [], projection: [] };
    current.ratings.push(review.rating);
    if (review.projectionRating) current.projection.push(review.projectionRating);
    counts.set(review.perfumeId, current);
  });
  const ranked = [...counts.values()].map((item) => ({
    ...item,
    avg: average(item.ratings),
    avgProjection: average(item.projection),
  }));
  const mostReviewed = ranked.sort((a, b) => b.ratings.length - a.ratings.length)[0];
  const lowestRated = [...ranked].filter((item) => item.ratings.length >= 1).sort((a, b) => a.avg - b.avg)[0];
  const noReviews = perfumes.filter((perfume) => !counts.has(perfume.id));
  const highViewsNoReviews = noReviews.sort((a, b) => b.viewCount - a.viewCount)[0];
  const weakProjection = ranked.find((item) => item.avg >= 4 && item.avgProjection > 0 && item.avgProjection < 3);
  const deliveryComplaints = approved.filter(
    (review) =>
      (review.deliveryRating != null && review.deliveryRating <= 2) ||
      /delivery|توصيل|مندوب/i.test(review.comment ?? '')
  ).length;
  const helpful = [...approved].sort((a, b) => b.helpfulYes - a.helpfulYes)[0];
  const recent30 = approved.filter((review) => review.createdAt >= new Date(Date.now() - 30 * 86400000)).length;
  const previous30 = approved.filter(
    (review) =>
      review.createdAt < new Date(Date.now() - 30 * 86400000) &&
      review.createdAt >= new Date(Date.now() - 60 * 86400000)
  ).length;
  const reviewText = approved
    .map((review) => review.comment ?? '')
    .join(' ')
    .toLowerCase();
  const mentionedNotes = perfumeNotes
    .map((note) => ({
      name: note.nameEn,
      count: [note.nameEn, note.nameAr].filter(Boolean).reduce(
        (sum, word) =>
          sum +
          (reviewText.match(
            new RegExp(
              String(word)
                .toLowerCase()
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'g'
            )
          )?.length ?? 0),
        0
      ),
    }))
    .filter((note) => note.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const complaintSignals = [
    { label: 'Weak performance', pattern: /weak|faint|ضعيف|خفيف/g },
    { label: 'Poor longevity', pattern: /doesn.t last|short.lived|ما يثبت|ثباته قليل/g },
    { label: 'Packaging issue', pattern: /packaging|box|bottle|تغليف|علبة|قنينة/g },
    { label: 'Delivery issue', pattern: /late|delay|delivery|تأخير|توصيل|مندوب/g },
    { label: 'Price concern', pattern: /expensive|overpriced|سعره غالي|غالي/g },
  ]
    .map((item) => ({ ...item, count: reviewText.match(item.pattern)?.length ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const cards = [
    {
      icon: Star,
      label: 'Average product rating',
      value: approved.length ? `${average(approved.map((review) => review.rating)).toFixed(1)} / 5` : '—',
    },
    { icon: MessageSquare, label: 'Approved reviews', value: approved.length.toString() },
    { icon: PackageSearch, label: 'Products without reviews', value: noReviews.length.toString() },
    {
      icon: BarChart3,
      label: 'Review growth · 30 days',
      value: `${recent30 >= previous30 ? '+' : ''}${recent30 - previous30}`,
    },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">Trust & moderation</p>
          <h1 className="font-display text-3xl text-parchment">Reviews Manager</h1>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-smoke">{reviewsTotal} results</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <Icon size={17} className="text-gold" />
            <p className="mt-4 font-display text-2xl text-parchment">{value}</p>
            <p className="mt-1 text-xs text-smoke">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-white/10 p-5">
        <h2 className="flex items-center gap-2 font-display text-xl text-parchment">
          <Eye size={17} className="text-gold" />
          Review insights
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mostReviewed && (
            <p className="rounded-md bg-white/[0.03] p-3 text-xs leading-6 text-smoke">
              <strong className="text-parchment">{mostReviewed.name}</strong> is the most reviewed product (
              {mostReviewed.ratings.length}).
            </p>
          )}
          {lowestRated && (
            <p className="rounded-md bg-white/[0.03] p-3 text-xs leading-6 text-smoke">
              <strong className="text-parchment">{lowestRated.name}</strong> currently has the lowest approved rating (
              {lowestRated.avg.toFixed(1)}).
            </p>
          )}
          {weakProjection && (
            <p className="rounded-md bg-white/[0.03] p-3 text-xs leading-6 text-smoke">
              <strong className="text-parchment">{weakProjection.name}</strong> rates highly overall, but projection
              averages {weakProjection.avgProjection.toFixed(1)}.
            </p>
          )}
          {highViewsNoReviews && (
            <p className="rounded-md bg-white/[0.03] p-3 text-xs leading-6 text-smoke">
              <strong className="text-parchment">{highViewsNoReviews.nameEn}</strong> has {highViewsNoReviews.viewCount}{' '}
              views but no approved reviews.
            </p>
          )}
          {deliveryComplaints > 0 && (
            <p className="rounded-md bg-white/[0.03] p-3 text-xs leading-6 text-smoke">
              <strong className="text-parchment">Delivery signal:</strong> {deliveryComplaints} approved reviews mention
              delivery or rate it low.
            </p>
          )}
          {helpful && helpful.helpfulYes > 0 && (
            <p className="rounded-md bg-white/[0.03] p-3 text-xs leading-6 text-smoke">
              <strong className="text-parchment">Most helpful:</strong> {helpful.perfume.nameEn} · {helpful.helpfulYes}{' '}
              helpful votes.
            </p>
          )}
        </div>
        {(mentionedNotes.length > 0 || complaintSignals.length > 0) && (
          <div className="mt-5 grid gap-5 border-t border-white/10 pt-5 md:grid-cols-2">
            <div>
              <p className="text-xs text-parchment">Most mentioned notes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {mentionedNotes.map((note) => (
                  <span
                    key={note.name}
                    className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-smoke"
                  >
                    {note.name} · {note.count}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-parchment">Most mentioned complaints</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {complaintSignals.slice(0, 5).map((item) => (
                  <span
                    key={item.label}
                    className="rounded-full border border-red-300/15 px-2.5 py-1 text-[10px] text-smoke"
                  >
                    {item.label} · {item.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <form className="grid gap-3 rounded-lg border border-white/10 p-4 sm:grid-cols-2 xl:grid-cols-5">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search customer, product, comment…"
          className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-xs text-parchment placeholder:text-smoke focus:border-gold/40 focus:outline-none"
        />
        <select
          name="product"
          defaultValue={searchParams.product ?? ''}
          className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
        >
          <option value="">All products</option>
          {perfumes.map((perfume) => (
            <option key={perfume.id} value={perfume.id}>
              {perfume.nameEn}
            </option>
          ))}
        </select>
        <select
          name="rating"
          defaultValue={searchParams.rating ?? ''}
          className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} stars
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? ''}
          className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
        >
          <option value="">All statuses</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink">
            Apply
          </button>
          <Link href="/studio/reviews" className="rounded-md border border-white/10 px-4 py-2 text-xs text-smoke">
            Clear
          </Link>
        </div>
      </form>

      <div className="space-y-4">
        {reviews.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title={
              searchParams.q || status || searchParams.product || searchParams.rating
                ? 'No matching reviews'
                : 'No reviews yet'
            }
            description={
              searchParams.q || status || searchParams.product || searchParams.rating
                ? 'Change the search or moderation filters to see other reviews.'
                : 'Customer reviews will appear here after they are submitted, ready for moderation.'
            }
            action={
              searchParams.q || status || searchParams.product || searchParams.rating
                ? { label: 'Clear filters', href: '/studio/reviews' }
                : undefined
            }
          />
        )}
        {reviews.map((review) => (
          <article key={review.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-parchment">
                    {review.reviewerName || review.user?.name || review.user?.email || 'Guest customer'}
                  </span>
                  {review.verifiedPurchase && (
                    <span className="rounded-full bg-studioBlue/10 px-2 py-1 text-[10px] text-studioBlue">
                      VERIFIED PURCHASE
                    </span>
                  )}
                  {review.isFeatured && (
                    <span className="rounded-full bg-gold/10 px-2 py-1 text-[10px] text-gold-bright">FEATURED</span>
                  )}
                </div>
                <Link
                  href={`/en/product/${review.perfume.slug}`}
                  target="_blank"
                  className="mt-1 block text-xs text-smoke hover:text-gold-bright"
                >
                  {review.perfume.nameEn}
                </Link>
              </div>
              <div className="text-end">
                <p className="text-sm text-gold-bright">{review.rating} ★</p>
                <p className="mt-1 text-[10px] text-smoke">{review.createdAt.toLocaleDateString('en-IQ')}</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-line text-sm leading-6 text-smoke">{review.comment}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-white/5 py-3 text-[10px] text-smoke">
              <span>Longevity {review.longevityRating ?? '—'}/5</span>
              <span>Projection {review.projectionRating ?? '—'}/5</span>
              <span>Sillage {review.sillageRating ?? '—'}/5</span>
              <span>Value {review.valueRating ?? '—'}/5</span>
              <span>
                Helpful {review.helpfulYes}/{review.helpfulNo}
              </span>
              <span>Reports {review.reportCount}</span>
              <StatusBadge status={review.approvalStatus} />
            </div>
            <div className="mt-4">
              <ReviewModerationButtons
                reviewId={review.id}
                status={review.approvalStatus}
                featured={review.isFeatured}
                reply={review.adminReply}
                images={review.images}
              />
            </div>
          </article>
        ))}
      </div>
      <StudioPagination
        path="/studio/reviews"
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
        total={reviewsTotal}
      />
    </div>
  );
}
