import type { Locale } from '@/lib/i18n';
import { tagLabel } from '@/lib/tag-labels';
import type { SimilarityWeights } from './similarity.service';

type ExplainInput = {
  topFactor: keyof SimilarityWeights;
  reference: {
    scentFamilies: string[];
    occasion: string[];
    season: string[];
  };
  candidate: {
    scentFamilies: string[];
    occasion: string[];
    season: string[];
  };
  brandName?: string;
};

/**
 * Turns a score breakdown into one plain sentence — "why am I seeing this?"
 * Per the spec: no technical language, no mention of scores or weights.
 * Falls back to a generic line if the top factor doesn't have anything
 * specific to name (e.g. two perfumes only agree on gender).
 */
export function explainRecommendation(input: ExplainInput, lang: Locale): string {
  const sharedFamily = input.reference.scentFamilies.find((f) =>
    input.candidate.scentFamilies.includes(f)
  );
  const sharedOccasion = input.reference.occasion.find((o) => input.candidate.occasion.includes(o));
  const sharedSeason = input.reference.season.find((s) => input.candidate.season.includes(s));

  switch (input.topFactor) {
    case 'notes':
      return lang === 'ar' ? 'يشترك بنوتات عطرية قريبة.' : 'Shares similar fragrance notes.';
    case 'family':
      return sharedFamily
        ? lang === 'ar'
          ? `من نفس العائلة العطرية: ${tagLabel(sharedFamily, lang)}.`
          : `Same fragrance family: ${tagLabel(sharedFamily, lang)}.`
        : lang === 'ar'
          ? 'من عائلة عطرية قريبة.'
          : 'A closely related fragrance family.';
    case 'brand':
      return input.brandName
        ? lang === 'ar'
          ? `رائج بين محبي ${input.brandName}.`
          : `Popular among fans of ${input.brandName}.`
        : lang === 'ar'
          ? 'من دار عطور مشابهة بالأسلوب.'
          : 'From a similarly styled house.';
    case 'occasion':
      return sharedOccasion
        ? lang === 'ar'
          ? `مناسب لنفس المناسبة: ${tagLabel(sharedOccasion, lang)}.`
          : `Fits the same occasion: ${tagLabel(sharedOccasion, lang)}.`
        : lang === 'ar'
          ? 'يناسب مناسبات مشابهة.'
          : 'Suits similar occasions.';
    case 'season':
      return sharedSeason
        ? lang === 'ar'
          ? `يناسب نفس الفصل: ${tagLabel(sharedSeason, lang)}.`
          : `Great for the same season: ${tagLabel(sharedSeason, lang)}.`
        : lang === 'ar'
          ? 'يناسب فصول مشابهة.'
          : 'Suits a similar season.';
    case 'style':
    case 'mood':
      return lang === 'ar' ? 'قريب بالطابع والمزاج.' : 'A similar character and mood.';
    case 'performance':
      return lang === 'ar'
        ? 'ثبات وانتشار مشابهين.'
        : 'Similar projection and longevity.';
    case 'price':
      return lang === 'ar'
        ? 'بديل بنفس الفئة السعرية.'
        : 'A great alternative in the same price range.';
    default:
      return lang === 'ar' ? 'قد يعجبك بنفس القدر.' : 'You might like this just as much.';
  }
}
