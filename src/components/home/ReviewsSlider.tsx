import { Star, BadgeCheck } from 'lucide-react';
import { localized } from '@/utils/localized';
import type ar from '@/dictionaries/ar';
import type { Locale } from '@/lib/i18n';

type ReviewCard = {
  id: string;
  rating: number;
  comment: string | null;
  reviewerName: string | null;
  verifiedPurchase: boolean;
  user: { name: string | null } | null;
  perfume: { nameEn: string; nameAr: string };
};

export default function ReviewsSlider({
  reviews,
  lang,
  dict,
}: {
  reviews: ReviewCard[];
  lang: Locale;
  dict: typeof ar;
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="content-auto border-t border-ink-line px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow mb-2">{dict.home.reviews.eyebrow}</p>
        <h2 className="mb-8 font-display text-2xl text-parchment md:text-3xl">
          {dict.home.reviews.title}
        </h2>
      </div>
      <div className="scrollbar-subtle mx-auto flex max-w-6xl snap-x gap-5 overflow-x-auto pb-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="hairline w-[85vw] max-w-80 shrink-0 snap-start rounded-sm p-6"
          >
            <div className="mb-3 flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < review.rating ? 'fill-gold text-gold' : 'text-ink-line'}
                />
              ))}
            </div>
            <p className="text-sm text-parchment">“{review.comment}”</p>
            <div className="mt-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-parchment">{review.reviewerName || review.user?.name}</p>
                <p className="eyebrow mt-0.5">
                  {dict.home.reviews.purchased} {localized(lang, review.perfume.nameEn, review.perfume.nameAr)}
                </p>
              </div>
              {review.verifiedPurchase && (
                <span className="flex items-center gap-1 text-xs text-gold-bright" title={dict.home.reviews.verified}>
                  <BadgeCheck size={14} />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
