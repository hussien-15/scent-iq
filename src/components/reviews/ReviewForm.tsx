'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Camera, Star } from 'lucide-react';
import { submitReview, type SubmitReviewState } from '@/actions/review';
import type { Locale } from '@/lib/i18n';
import type ar from '@/dictionaries/ar';

const initialState: SubmitReviewState = {};
const inputClass =
  'w-full rounded-sm border border-ink-line bg-transparent px-4 py-3 text-sm text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none';

function SubmitButton({ dict }: { dict: typeof ar }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-bright disabled:opacity-50 sm:w-auto"
    >
      {pending ? dict.product.reviewsSection.submitting : dict.product.reviewsSection.submit}
    </button>
  );
}

function StarField({
  name,
  label,
  large = false,
  optional = false,
}: {
  name: string;
  label: string;
  large?: boolean;
  optional?: boolean;
}) {
  const [value, setValue] = useState(0);
  const size = large ? 30 : 20;

  return (
    <fieldset>
      <legend className="mb-2 text-xs text-smoke">
        {label}
      </legend>
      <input type="hidden" name={name} value={value || ''} />
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} / 5`}
            onClick={() => setValue(rating)}
            className="rounded p-1 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gold"
          >
            <Star size={size} className={rating <= value ? 'fill-gold text-gold' : 'text-ink-line'} />
          </button>
        ))}
        {optional && value > 0 && (
          <button type="button" onClick={() => setValue(0)} className="ms-2 text-[11px] text-smoke hover:text-parchment">
            ×
          </button>
        )}
      </div>
    </fieldset>
  );
}

export default function ReviewForm({
  perfumeId,
  defaultName,
  isSignedIn,
  lang,
  dict,
}: {
  perfumeId: string;
  defaultName?: string;
  isSignedIn: boolean;
  lang: Locale;
  dict: typeof ar;
}) {
  const [state, formAction] = useFormState(submitReview, initialState);
  const errorMessage = state.error ? dict.product.reviewsSection.errors[state.error] : null;
  const occasions = [
    ['daily', 'Daily', 'يومي'], ['office', 'Office', 'الدوام'], ['date', 'Date', 'موعد'],
    ['wedding', 'Wedding', 'زفاف'], ['formal', 'Formal', 'رسمي'], ['night', 'Night', 'مسائي'], ['travel', 'Travel', 'سفر'],
  ];
  const seasons = [
    ['spring', 'Spring', 'الربيع'], ['summer', 'Summer', 'الصيف'],
    ['autumn', 'Autumn', 'الخريف'], ['winter', 'Winter', 'الشتاء'],
  ];

  if (state.success) {
    return (
      <div className="rounded-sm border border-gold/30 bg-gold/5 p-5 text-sm text-parchment">
        {dict.product.reviewsSection.submitted}
      </div>
    );
  }

  return (
    <details className="group rounded-sm border border-ink-line bg-ink-soft/40">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <span>
          <span className="block font-display text-xl text-parchment">{dict.product.reviewsSection.writeReview}</span>
          <span className="mt-1 block text-xs text-smoke">{dict.product.reviewsSection.formIntro}</span>
        </span>
        <span className="text-2xl text-gold transition-transform group-open:rotate-45">+</span>
      </summary>
      <form action={formAction} className="space-y-7 border-t border-ink-line p-5 md:p-7">
        <input type="hidden" name="perfumeId" value={perfumeId} />
        <input type="hidden" name="lang" value={lang} />

        {errorMessage && (
          <p className="rounded-sm border border-red-300/20 bg-red-300/10 px-4 py-3 text-xs text-red-200">
            {errorMessage}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <input name="reviewerName" defaultValue={defaultName ?? ''} placeholder={dict.product.reviewsSection.name} required className={inputClass} />
          <div>
            <input name="phone" type="tel" placeholder={dict.product.reviewsSection.phone} required={!isSignedIn} className={inputClass} />
            <p className="mt-1 text-[11px] text-smoke">{dict.product.reviewsSection.phoneHint}</p>
          </div>
        </div>

        <StarField name="rating" label={dict.product.reviewsSection.overall} large />

        <div>
          <p className="eyebrow mb-4">{dict.product.reviewsSection.detailedRatings}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StarField name="longevityRating" label={dict.product.reviewsSection.longevity} />
            <StarField name="projectionRating" label={dict.product.reviewsSection.projection} />
            <StarField name="sillageRating" label={dict.product.reviewsSection.sillage} />
            <StarField name="valueRating" label={dict.product.reviewsSection.value} />
            <StarField name="smellQualityRating" label={dict.product.reviewsSection.smellQuality} />
            <StarField name="packagingQualityRating" label={`${dict.product.reviewsSection.packaging} (${lang === 'ar' ? 'اختياري' : 'optional'})`} optional />
            <StarField name="deliveryRating" label={`${dict.product.reviewsSection.delivery} (${lang === 'ar' ? 'اختياري' : 'optional'})`} optional />
          </div>
        </div>

        <textarea name="comment" rows={6} minLength={20} maxLength={2000} required placeholder={dict.product.reviewsSection.comment} className={inputClass} />

        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-xs text-smoke">{dict.product.reviewsSection.wouldRecommend}</legend>
            <div className="flex gap-4 text-sm text-parchment">
              <label className="flex items-center gap-2"><input type="radio" name="wouldRecommend" value="yes" required className="accent-gold" />{dict.product.reviewsSection.yes}</label>
              <label className="flex items-center gap-2"><input type="radio" name="wouldRecommend" value="no" className="accent-gold" />{dict.product.reviewsSection.no}</label>
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs text-smoke">{dict.product.reviewsSection.wouldBuyAgain}</legend>
            <div className="flex gap-4 text-sm text-parchment">
              <label className="flex items-center gap-2"><input type="radio" name="wouldBuyAgain" value="yes" className="accent-gold" />{dict.product.reviewsSection.yes}</label>
              <label className="flex items-center gap-2"><input type="radio" name="wouldBuyAgain" value="no" className="accent-gold" />{dict.product.reviewsSection.no}</label>
            </div>
          </fieldset>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <select name="ageRange" defaultValue="" className={inputClass}><option value="">{dict.product.reviewsSection.ageRange}</option><option value="18-24">18–24</option><option value="25-34">25–34</option><option value="35-44">35–44</option><option value="45+">45+</option></select>
          <select name="reviewerGender" defaultValue="" className={inputClass}><option value="">{dict.product.reviewsSection.gender}</option><option value="masculine">{lang === 'ar' ? 'رجل' : 'Man'}</option><option value="feminine">{lang === 'ar' ? 'امرأة' : 'Woman'}</option><option value="prefer-not">{lang === 'ar' ? 'أفضل ما أذكر' : 'Prefer not to say'}</option></select>
          <select name="usageOccasion" defaultValue="" className={inputClass}><option value="">{dict.product.reviewsSection.occasion}</option>{occasions.map(([value, en, ar]) => <option key={value} value={value}>{lang === 'ar' ? ar : en}</option>)}</select>
          <select name="seasonUsed" defaultValue="" className={inputClass}><option value="">{dict.product.reviewsSection.season}</option>{seasons.map(([value, en, ar]) => <option key={value} value={value}>{lang === 'ar' ? ar : en}</option>)}</select>
        </div>

        <label className="block rounded-sm border border-dashed border-ink-line p-4">
          <span className="flex items-center gap-2 text-sm text-parchment"><Camera size={17} className="text-gold" />{dict.product.reviewsSection.photo}</span>
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" className="mt-3 block w-full text-xs text-smoke file:me-3 file:rounded-full file:border-0 file:bg-gold/10 file:px-3 file:py-2 file:text-gold-bright" />
          <span className="mt-2 block text-[11px] text-smoke">{dict.product.reviewsSection.photoHint}</span>
        </label>

        <SubmitButton dict={dict} />
      </form>
    </details>
  );
}
