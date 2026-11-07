import { z } from 'zod';

import { enrollmentTypeSchema } from './catalog.schema';
import { couponSourceSchema } from './coupon.schema';
import { paymentMethodSchema } from './revenue.schema';

// Purchases page (Student): GET /api/enrollments/me/purchases — the student's own orders and totals (no VAT).

export const purchaseSchema = z.object({
  _id: z.string(),
  course: z
    .object({
      _id: z.string(),
      title: z.string().catch(''),
      coverImage: z.string().nullish(),
      batchNumber: z.string().nullish(),
    })
    .nullable()
    .catch(null),
  enrollmentType: enrollmentTypeSchema.catch('free'),
  listPrice: z.number().catch(0),
  discountAmount: z.number().catch(0),
  discountPercent: z.number().catch(0),
  amountPaid: z.number().catch(0),
  currency: z.string().catch('BDT'),
  couponCode: z.string().nullish(),
  couponSource: couponSourceSchema.nullish(),
  paymentMethod: paymentMethodSchema.nullish(),
  createdAt: z.string(),
});
export type Purchase = z.infer<typeof purchaseSchema>;

export const purchasesSchema = z.object({
  purchases: z.array(purchaseSchema),
  totals: z.object({
    courses: z.number(),
    paidCourses: z.number(),
    totalSpent: z.number(),
    totalSaved: z.number(),
  }),
});
export type Purchases = z.infer<typeof purchasesSchema>;
