import { z } from 'zod';

export const iraqiPhoneSchema = z.string().trim().min(10).max(20)
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .refine((value) => /^(?:\+?964|0)7[3-9]\d{8}$/.test(value), 'Invalid Iraqi mobile number');

const optionalPhone = z.preprocess(
  (value) => typeof value === 'string' && !value.trim() ? undefined : value,
  iraqiPhoneSchema.optional()
);

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: iraqiPhoneSchema,
  alternativePhone: optionalPhone,
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().max(120).optional(),
  address: z.string().trim().min(5).max(500),
  landmark: z.string().trim().max(240).optional(),
  deliveryNotes: z.string().trim().max(500).optional(),
  deliveryCompanyId: z.string().min(1).max(100),
  analyticsSessionId: z.string().min(8).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  submissionId: z.string().uuid(),
  items: z.array(z.object({
    perfumeId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    quantity: z.number().int().min(1).max(20),
    collectionId: z.string().uuid().optional(),
  })).min(1).max(50),
}).superRefine((data, context) => {
  const targets = new Set<string>();
  for (const [index, item] of data.items.entries()) {
    const key = `${item.perfumeId}:${item.variantId ?? 'base'}`;
    if (targets.has(key)) context.addIssue({ code: 'custom', path: ['items', index], message: 'Duplicate cart item.' });
    targets.add(key);
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
