'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import {
  BadgeCheck,
  ChevronDown,
  Flag,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { reportReview, voteReview } from '@/actions/review';
import ReviewForm from '@/components/reviews/ReviewForm';
import type { Locale } from '@/lib/i18n';
import type ar from '@/dictionaries/ar';
import EmptyState from '@/components/ui/EmptyState';

export type PublicReview = {
  id: string;
  rating: number;
  longevityRating: number | null;
  projectionRating: number | null;
  sillageRating: number | null;
  valueRating: number | null;
  smellQualityRating: number | null;
  packagingQualityRating: number | null;
  deliveryRating: number | null;
  comment: string | null;
  wouldRecommend: boolean | null;
  reviewerName: string | null;
  user: { name: string | null } | null;
  verifiedPurchase: boolean;
  isFeatured: boolean;
  helpfulYes: number;
  helpfulNo: number;
  ageRange: string | null;
  reviewerGender: string | null;
  usageOccasion: string | null;
  seasonUsed: string | null;
  adminReply: string | null;
  createdAt: string;
  images: { id: string; url: string; altText: string | null }[];
};

type SortKey = 'helpful' | 'newest' | 'highest' | 'lowest' | 'verified' | 'photos';

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={size} className={index < Math.round(value) ? 'fill-gold text-gold' : 'text-ink-line'} />
      ))}
    </span>
  );
}

function voterToken() {
  const key = 'scentiq-review-voter';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const token = window.crypto.randomUUID();
  window.localStorage.setItem(key, token);
  return token;
}

function optionLabel(value: string | null, lang: Locale) {
  if (!value) return null;
  const labels: Record<string, [string, string]> = {
    spring: ['Spring', 'الربيع'],
    summer: ['Summer', 'الصيف'],
    autumn: ['Autumn', 'الخريف'],
    winter: ['Winter', 'الشتاء'],
    daily: ['Daily', 'يومي'],
    office: ['Office', 'الدوام'],
    date: ['Date', 'موعد'],
    wedding: ['Wedding', 'زفاف'],
    formal: ['Formal', 'رسمي'],
    night: ['Night', 'مسائي'],
    travel: ['Travel', 'سفر'],
    masculine: ['Man', 'رجل'],
    feminine: ['Woman', 'امرأة'],
    'prefer-not': ['Not stated', 'غير مذكور'],
  };
  return labels[value]?.[lang === 'ar' ? 1 : 0] ?? value;
}

export default function ReviewsSection({
  reviews,
  perfumeId,
  lang,
  dict,
  defaultReviewerName,
  isSignedIn,
}: {
  reviews: PublicReview[];
  perfumeId: string;
  lang: Locale;
  dict: typeof ar;
  defaultReviewerName?: string;
  isSignedIn: boolean;
}) {
  const [sort, setSort] = useState<SortKey>('helpful');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [longevity, setLongevity] = useState('all');
  const [projection, setProjection] = useState('all');
  const [season, setSeason] = useState('all');
  const [occasion, setOccasion] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [photosOnly, setPhotosOnly] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<Record<string, { yes: number; no: number }>>({});
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const count = reviews.length;
  const average = count ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => review.rating === star).length,
  }));
  const recommendationResponses = reviews.filter((review) => review.wouldRecommend != null);
  const recommended = recommendationResponses.filter((review) => review.wouldRecommend).length;
  const detailed = [
    ['longevityRating', dict.product.reviewsSection.longevity],
    ['projectionRating', dict.product.reviewsSection.projection],
    ['sillageRating', dict.product.reviewsSection.sillage],
    ['valueRating', dict.product.reviewsSection.value],
    ['smellQualityRating', dict.product.reviewsSection.smellQuality],
  ] as const;
  const detailedAverages = detailed.map(([key, label]) => {
    const values = reviews.map((review) => review[key]).filter((value): value is number => value != null);
    return { key, label, value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0 };
  });

  const visibleReviews = useMemo(() => {
    const result = reviews.filter((review) => {
      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === 'positive' && review.rating >= 4) ||
        (ratingFilter === 'critical' && review.rating <= 2) ||
        review.rating === Number(ratingFilter);
      return (
        matchesRating &&
        (longevity === 'all' || review.longevityRating === Number(longevity)) &&
        (projection === 'all' || review.projectionRating === Number(projection)) &&
        (season === 'all' || review.seasonUsed === season) &&
        (occasion === 'all' || review.usageOccasion === occasion) &&
        (!verifiedOnly || review.verifiedPurchase) &&
        (!photosOnly || review.images.length > 0)
      );
    });
    return result.sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'highest') return b.rating - a.rating;
      if (sort === 'lowest') return a.rating - b.rating;
      if (sort === 'verified')
        return Number(b.verifiedPurchase) - Number(a.verifiedPurchase) || b.helpfulYes - a.helpfulYes;
      if (sort === 'photos') return b.images.length - a.images.length || b.helpfulYes - a.helpfulYes;
      return (
        Number(b.isFeatured) - Number(a.isFeatured) ||
        Number(b.verifiedPurchase) - Number(a.verifiedPurchase) ||
        b.helpfulYes - a.helpfulYes
      );
    });
  }, [reviews, ratingFilter, longevity, projection, season, occasion, verifiedOnly, photosOnly, sort]);

  function clearFilters() {
    setRatingFilter('all');
    setLongevity('all');
    setProjection('all');
    setSeason('all');
    setOccasion('all');
    setVerifiedOnly(false);
    setPhotosOnly(false);
  }

  function castVote(review: PublicReview, value: 'HELPFUL' | 'NOT_HELPFUL') {
    startTransition(async () => {
      const next = await voteReview(review.id, value, voterToken());
      if (next) setVotes((current) => ({ ...current, [review.id]: { yes: next.helpfulYes, no: next.helpfulNo } }));
    });
  }

  function sendReport(reviewId: string) {
    startTransition(async () => {
      await reportReview(reviewId, voterToken());
      setReported((current) => new Set(current).add(reviewId));
    });
  }

  const selectClass =
    'rounded-sm border border-ink-line bg-ink px-3 py-2 text-xs text-parchment focus:border-gold/50 focus:outline-none';
  const filters = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <select
        value={ratingFilter}
        onChange={(event) => setRatingFilter(event.target.value)}
        className={selectClass}
        aria-label={dict.product.reviewsSection.allRatings}
      >
        <option value="all">{dict.product.reviewsSection.allRatings}</option>
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value} ★
          </option>
        ))}
        <option value="positive">{dict.product.reviewsSection.positive}</option>
        <option value="critical">{dict.product.reviewsSection.critical}</option>
      </select>
      <select
        value={longevity}
        onChange={(event) => setLongevity(event.target.value)}
        className={selectClass}
        aria-label={dict.product.reviewsSection.longevity}
      >
        <option value="all">
          {dict.product.reviewsSection.longevity}: {dict.product.reviewsSection.all}
        </option>
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value} ★
          </option>
        ))}
      </select>
      <select
        value={projection}
        onChange={(event) => setProjection(event.target.value)}
        className={selectClass}
        aria-label={dict.product.reviewsSection.projection}
      >
        <option value="all">
          {dict.product.reviewsSection.projection}: {dict.product.reviewsSection.all}
        </option>
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value} ★
          </option>
        ))}
      </select>
      <select
        value={season}
        onChange={(event) => setSeason(event.target.value)}
        className={selectClass}
        aria-label={dict.product.reviewsSection.season}
      >
        <option value="all">
          {dict.product.reviewsSection.season}: {dict.product.reviewsSection.all}
        </option>
        {['spring', 'summer', 'autumn', 'winter'].map((value) => (
          <option key={value} value={value}>
            {optionLabel(value, lang)}
          </option>
        ))}
      </select>
      <select
        value={occasion}
        onChange={(event) => setOccasion(event.target.value)}
        className={selectClass}
        aria-label={dict.product.reviewsSection.occasion}
      >
        <option value="all">
          {dict.product.reviewsSection.occasion}: {dict.product.reviewsSection.all}
        </option>
        {['daily', 'office', 'date', 'wedding', 'formal', 'night', 'travel'].map((value) => (
          <option key={value} value={value}>
            {optionLabel(value, lang)}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-xs text-smoke">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(event) => setVerifiedOnly(event.target.checked)}
          className="accent-gold"
        />
        {dict.product.reviewsSection.verifiedOnly}
      </label>
      <label className="flex items-center gap-2 text-xs text-smoke">
        <input
          type="checkbox"
          checked={photosOnly}
          onChange={(event) => setPhotosOnly(event.target.checked)}
          className="accent-gold"
        />
        {dict.product.reviewsSection.withPhotos}
      </label>
      <button type="button" onClick={clearFilters} className="text-start text-xs text-gold-bright hover:text-parchment">
        {dict.product.reviewsSection.clearFilters}
      </button>
    </div>
  );

  return (
    <section id="reviews" className="scroll-mt-24 border-t border-ink-line py-14">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">{dict.product.reviewsSection.title}</p>
          <h2 className="font-display text-3xl text-parchment">{dict.product.reviewsSection.overall}</h2>
        </div>
        <ReviewForm
          perfumeId={perfumeId}
          defaultName={defaultReviewerName}
          isSignedIn={isSignedIn}
          lang={lang}
          dict={dict}
        />
      </div>

      {count === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={dict.ui.empty.reviewsTitle}
          description={dict.ui.empty.reviewsDescription}
          compact
        />
      ) : (
        <>
          <div className="grid gap-8 rounded-sm border border-ink-line bg-ink-soft/40 p-6 md:grid-cols-[180px_1fr_1.2fr] md:p-8">
            <div className="text-center md:text-start">
              <p className="font-display text-5xl text-gold-bright">{average.toFixed(1)}</p>
              <div className="mt-2 flex justify-center md:justify-start">
                <Stars value={average} size={16} />
              </div>
              <p className="mt-2 text-xs text-smoke">
                {dict.product.reviewsSection.basedOn} {count}{' '}
                {count === 1 ? dict.product.reviewsSection.review : dict.product.reviewsSection.reviews}
              </p>
              {recommendationResponses.length > 0 && (
                <p className="mt-4 text-xs text-parchment">
                  <span className="font-display text-xl text-gold-bright">
                    {Math.round((recommended / recommendationResponses.length) * 100)}%
                  </span>{' '}
                  {dict.product.reviewsSection.recommendRate}
                </p>
              )}
            </div>
            <div className="space-y-2">
              {distribution.map(({ star, count: amount }) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingFilter(String(star))}
                  className="flex w-full items-center gap-3"
                  aria-label={`${star} stars: ${amount}`}
                >
                  <span className="w-4 text-xs text-smoke">{star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-line">
                    <div className="h-full bg-gold" style={{ width: `${(amount / count) * 100}%` }} />
                  </div>
                  <span className="w-5 text-xs text-smoke">{amount}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {detailedAverages.map(
                ({ key, label, value }) =>
                  value > 0 && (
                    <div key={key}>
                      <div className="mb-1 flex justify-between gap-2 text-[11px] text-smoke">
                        <span>{label}</span>
                        <span>{value.toFixed(1)}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-ink-line">
                        <div className="h-full bg-gold" style={{ width: `${value * 20}%` }} />
                      </div>
                    </div>
                  )
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-y border-ink-line py-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-smoke">
                {visibleReviews.length} {dict.product.reviewsSection.results}
              </span>
              <label className="flex items-center gap-2 text-xs text-smoke">
                {dict.product.reviewsSection.sortBy}
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className={selectClass}
                >
                  {(Object.keys(dict.product.reviewsSection.sort) as SortKey[]).map((key) => (
                    <option key={key} value={key}>
                      {dict.product.reviewsSection.sort[key]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="hidden md:block">{filters}</div>
            <details className="group md:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-sm border border-ink-line px-4 py-3 text-sm text-parchment">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={15} />
                  {dict.product.reviewsSection.filters}
                </span>
                <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="pt-4">{filters}</div>
            </details>
          </div>

          <div className="space-y-5 pt-6">
            {visibleReviews.length === 0 && (
              <p className="py-8 text-center text-sm text-smoke">{dict.product.reviewsSection.noMatches}</p>
            )}
            {visibleReviews.map((review) => {
              const name =
                review.reviewerName || review.user?.name || (lang === 'ar' ? 'زبون ScentIQ' : 'ScentIQ customer');
              const long = (review.comment?.length ?? 0) > 280;
              const isExpanded = expanded.has(review.id);
              const counts = votes[review.id] ?? { yes: review.helpfulYes, no: review.helpfulNo };
              return (
                <article key={review.id} className="rounded-sm border border-ink-line bg-ink-soft/25 p-5 md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Stars value={review.rating} />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-parchment">{name}</span>
                        {review.verifiedPurchase && (
                          <span className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-1 text-[10px] text-gold-bright">
                            <BadgeCheck size={12} />
                            {dict.product.reviewsSection.verified}
                          </span>
                        )}
                        {review.isFeatured && (
                          <span className="flex items-center gap-1 rounded-full border border-gold/25 px-2 py-1 text-[10px] text-gold-bright">
                            <Sparkles size={11} />
                            {dict.product.reviewsSection.featured}
                          </span>
                        )}
                      </div>
                    </div>
                    <time className="text-[11px] text-smoke" dateTime={review.createdAt}>
                      {new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ' : 'en-IQ', { dateStyle: 'medium' }).format(
                        new Date(review.createdAt)
                      )}
                    </time>
                  </div>

                  <p
                    className={`mt-5 whitespace-pre-line text-sm leading-7 text-parchment ${long && !isExpanded ? 'line-clamp-4' : ''}`}
                  >
                    {review.comment}
                  </p>
                  {long && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((current) => {
                          const next = new Set(current);
                          if (isExpanded) next.delete(review.id);
                          else next.add(review.id);
                          return next;
                        })
                      }
                      className="mt-2 text-xs text-gold-bright"
                    >
                      {isExpanded ? dict.product.reviewsSection.showLess : dict.product.reviewsSection.showMore}
                    </button>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      review.ageRange,
                      optionLabel(review.reviewerGender, lang),
                      optionLabel(review.seasonUsed, lang),
                      optionLabel(review.usageOccasion, lang),
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-ink-line px-2.5 py-1 text-[10px] text-smoke"
                        >
                          {item}
                        </span>
                      ))}
                  </div>

                  {review.images.length > 0 && (
                    <div className="scrollbar-subtle mt-5 flex gap-3 overflow-x-auto pb-1">
                      {review.images.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-ink-line"
                        >
                          <Image
                            src={photo.url}
                            alt={photo.altText ?? name}
                            fill
                            quality={65}
                            sizes="96px"
                            className="object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {review.adminReply && (
                    <div className="mt-5 border-s-2 border-gold/50 bg-gold/5 px-4 py-3">
                      <p className="eyebrow mb-1">{dict.product.reviewsSection.replyFromScentIQ}</p>
                      <p className="text-xs leading-6 text-parchment">{review.adminReply}</p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ink-line pt-4 text-xs text-smoke">
                    <span className="me-1">{dict.product.reviewsSection.helpfulQuestion}</span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => castVote(review, 'HELPFUL')}
                      className="flex min-h-9 items-center gap-1 rounded-full border border-ink-line px-3 hover:border-gold/40 hover:text-parchment"
                    >
                      <ThumbsUp size={13} />
                      {dict.product.reviewsSection.helpfulYes} ({counts.yes})
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => castVote(review, 'NOT_HELPFUL')}
                      className="flex min-h-9 items-center gap-1 rounded-full border border-ink-line px-3 hover:border-gold/40 hover:text-parchment"
                    >
                      <ThumbsDown size={13} />
                      {dict.product.reviewsSection.helpfulNo} ({counts.no})
                    </button>
                    <button
                      type="button"
                      disabled={reported.has(review.id) || isPending}
                      onClick={() => sendReport(review.id)}
                      className="ms-auto flex min-h-9 items-center gap-1 px-2 hover:text-parchment"
                    >
                      <Flag size={13} />
                      {reported.has(review.id)
                        ? dict.product.reviewsSection.reported
                        : dict.product.reviewsSection.report}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
