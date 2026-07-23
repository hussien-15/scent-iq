import { z } from 'zod';

const rating = z.number().int().min(1).max(5);

export const reviewSubmissionSchema = z.object({
  perfumeId: z.string().min(1),
  reviewerName: z.string().min(2).max(80),
  phone: z.string().min(7).max(30).optional(),
  rating,
  longevityRating: rating,
  projectionRating: rating,
  sillageRating: rating,
  valueRating: rating,
  smellQualityRating: rating,
  packagingQualityRating: rating.optional(),
  deliveryRating: rating.optional(),
  comment: z.string().min(20).max(2000),
  wouldRecommend: z.boolean(),
  wouldBuyAgain: z.boolean().optional(),
  ageRange: z.string().max(30).optional(),
  reviewerGender: z.string().max(30).optional(),
  usageOccasion: z.string().max(40).optional(),
  seasonUsed: z.string().max(30).optional(),
});

export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;
