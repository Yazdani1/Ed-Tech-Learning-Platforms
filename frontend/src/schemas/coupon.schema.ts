import { z } from 'zod';

/** Where a code comes from: the course's own discount, one of its coupons, or a promo. */
export const couponSourceSchema = z.enum(['course', 'coupon', 'promo']);
export type CouponSource = z.infer<typeof couponSourceSchema>;

/**
 * `offer` of a public course (GET /api/courses, /browse, /:id) and GET /api/coupons/check: what a code gives on
 * the course right now. The course pages pre-fill the best one (null = no running discount).
 */
export const courseOfferSchema = z.object({
  code: z.string(),
  source: couponSourceSchema,
  price: z.number(),
  listPrice: z.number(),
  discountAmount: z.number(),
  discountPercent: z.number(),
  startsAt: z.string().nullish(),
  endsAt: z.string().nullish(),
});
export type CourseOffer = z.infer<typeof courseOfferSchema>;

export const discountTypeSchema = z.enum(['percent', 'amount']);
export type DiscountType = z.infer<typeof discountTypeSchema>;

export const couponStatusSchema = z.enum(['active', 'scheduled', 'expired', 'inactive', 'used-up']);
export type CouponStatus = z.infer<typeof couponStatusSchema>;

/** GET /api/coupons?course= items: the course's own discount ("auto"), its coupons and the promos it is in. */
export const courseCouponSchema = z.object({
  _id: z.string(),
  kind: z.enum(['auto', 'coupon', 'promo']),
  code: z.string(),
  title: z.string().nullish(),
  discountType: discountTypeSchema,
  value: z.number(),
  startsAt: z.string().nullish(),
  endsAt: z.string().nullish(),
  usageLimit: z.number().nullish(),
  usedCount: z.number().catch(0),
  isActive: z.boolean().catch(true),
  status: couponStatusSchema.catch('active'),
  createdAt: z.string().nullish(),
});
export type CourseCoupon = z.infer<typeof courseCouponSchema>;

const PERCENT_MAX = 100;
const CODE_PATTERN = /^[A-Za-z0-9-]{6,20}$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const LIMIT_PATTERN = /^[1-9]\d{0,5}$/;

/** The coupon form (course Coupons page). Messages are i18n keys. */
export const couponFormSchema = z
  .object({
    code: z.string().trim().regex(CODE_PATTERN, 'coupons.validation.code'),
    discountType: discountTypeSchema,
    value: z.string().trim().regex(AMOUNT_PATTERN, 'coupons.validation.value'),
    unlimited: z.boolean(),
    usageLimit: z.string().trim(),
    startsAt: z.string(),
    endsAt: z.string(),
  })
  .superRefine((values, ctx) => {
    if (Number(values.value) <= 0)
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'coupons.validation.value' });
    if (values.discountType === 'percent' && Number(values.value) > PERCENT_MAX)
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'coupons.validation.percent' });
    if (!values.unlimited && !LIMIT_PATTERN.test(values.usageLimit))
      ctx.addIssue({ code: 'custom', path: ['usageLimit'], message: 'coupons.validation.limit' });
    if (values.startsAt && values.endsAt && new Date(values.endsAt) <= new Date(values.startsAt))
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'coupons.validation.endAfterStart',
      });
  });
export type CouponForm = z.infer<typeof couponFormSchema>;
