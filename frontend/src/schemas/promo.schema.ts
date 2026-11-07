import { z } from 'zod';

import { discountTypeSchema } from './coupon.schema';
import { courseCardSchema } from './public.schema';

// Promos: GET/POST/PATCH/DELETE /api/promos (Super Admin, Admin) and the public running promos.

const promoCourseSchema = z.object({
  _id: z.string(),
  title: z.string().catch(''),
  coverImage: z.string().nullish(),
  batchNumber: z.string().nullish(),
});

/** GET /api/promos items. */
export const promoSchema = z.object({
  _id: z.string(),
  title: z.string(),
  code: z.string(),
  discountType: discountTypeSchema,
  value: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  courses: z.array(promoCourseSchema.nullable()).catch([]),
  isActive: z.boolean().catch(true),
  status: z.enum(['active', 'scheduled', 'expired', 'inactive']).catch('active'),
  usedCount: z.number().catch(0),
  createdBy: z.object({ _id: z.string(), name: z.string().catch('') }).nullish(),
  createdAt: z.string().nullish(),
});
export type Promo = z.infer<typeof promoSchema>;

/** GET /api/promos/active items: the banner and pop-up of a running promo. */
export const activePromoSchema = z.object({
  _id: z.string(),
  title: z.string(),
  code: z.string(),
  discountType: discountTypeSchema,
  value: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
  courseCount: z.number(),
});
export type ActivePromo = z.infer<typeof activePromoSchema>;

/** GET /api/promos/active/courses items: course cards with their offer. */
export const promoCourseCardSchema = courseCardSchema;

const PERCENT_MAX = 100;
const CODE_PATTERN = /^[A-Za-z0-9-]{6,20}$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** The promo form. Messages are i18n keys. */
export const promoFormSchema = z
  .object({
    title: z.string().trim().min(1, 'validation.required').max(120, 'promos.validation.titleLong'),
    code: z.string().trim().regex(CODE_PATTERN, 'coupons.validation.code'),
    discountType: discountTypeSchema,
    value: z.string().trim().regex(AMOUNT_PATTERN, 'coupons.validation.value'),
    startsAt: z.string().min(1, 'validation.required'),
    endsAt: z.string().min(1, 'validation.required'),
    courseIds: z.array(z.string()).min(1, 'promos.validation.courses'),
  })
  .superRefine((values, ctx) => {
    if (Number(values.value) <= 0)
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'coupons.validation.value' });
    if (values.discountType === 'percent' && Number(values.value) > PERCENT_MAX)
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'coupons.validation.percent' });
    if (values.startsAt && values.endsAt && new Date(values.endsAt) <= new Date(values.startsAt))
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'coupons.validation.endAfterStart',
      });
  });
export type PromoForm = z.infer<typeof promoFormSchema>;

/** GET /api/promos/design (public): custom banner and pop-up pictures of running promos ('' = default design) */
export const promoDesignSchema = z.object({
  bannerImage: z.string().catch(''),
  popupImage: z.string().catch(''),
});
export type PromoDesign = z.infer<typeof promoDesignSchema>;
export const PROMO_DESIGN_SLOTS = ['banner', 'popup'] as const;
export type PromoDesignSlot = (typeof PROMO_DESIGN_SLOTS)[number];
