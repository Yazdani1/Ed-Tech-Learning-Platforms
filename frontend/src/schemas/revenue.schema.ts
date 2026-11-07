import { z } from 'zod';

import { enrollmentTypeSchema } from './catalog.schema';
import { couponSourceSchema } from './coupon.schema';

// Orders (= enrolments with their price snapshot): GET /api/revenue/orders (every course) and
// GET /api/enrollments/admin/course/:courseId (one course), both Super Admin and Admin. Plus the revenue summary.

export const paymentMethodSchema = z.enum(['bkash', 'other']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/** The buyer (null when the account was deleted). */
export const orderStudentSchema = z
  .object({
    _id: z.string(),
    name: z.string().catch(''),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    studentNumber: z.string().nullish(),
    avatar: z.string().nullish(),
  })
  .nullable()
  .catch(null);
export type OrderStudent = z.infer<typeof orderStudentSchema>;

export const orderCourseSchema = z
  .object({
    _id: z.string(),
    title: z.string().catch(''),
    batchNumber: z.string().nullish(),
    coverImage: z.string().nullish(),
  })
  .nullable()
  .catch(null);

export const orderSchema = z.object({
  _id: z.string(),
  student: orderStudentSchema,
  course: orderCourseSchema,
  enrollmentType: enrollmentTypeSchema.catch('free'),
  listPrice: z.number().catch(0),
  paidPrice: z.number().catch(0),
  discountAmount: z.number().catch(0),
  discountPercent: z.number().catch(0),
  currency: z.string().catch('BDT'),
  couponCode: z.string().nullish(),
  couponSource: couponSourceSchema.nullish(),
  paymentMethod: paymentMethodSchema.nullish(),
  /** VAT included in paidPrice (internal: rate in force when bought) */
  vatPercent: z.number().catch(0),
  vatAmount: z.number().catch(0),
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const ORDER_TYPES = ['all', 'paid', 'free', 'subscription'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

const totalsSchema = z.object({
  revenue: z.number(),
  vat: z.number().catch(0),
  orders: z.number(),
  paidOrders: z.number(),
});
const pointSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  vat: z.number().catch(0),
  orders: z.number(),
  paidOrders: z.number(),
});
export type RevenuePoint = z.infer<typeof pointSchema>;

/** GET /api/revenue/summary */
export const revenueSummarySchema = z.object({
  totals: z.object({
    today: totalsSchema,
    week: totalsSchema,
    month: totalsSchema,
    lifetime: totalsSchema,
  }),
  daily: z.array(pointSchema),
  weekly: z.array(pointSchema),
  monthly: z.array(pointSchema),
});
export type RevenueSummary = z.infer<typeof revenueSummarySchema>;

/** GET /api/revenue/months: one row per month (yyyy-MM), newest first */
export const revenueMonthSchema = z.object({
  month: z.string(),
  revenue: z.number(),
  vat: z.number(),
  orders: z.number(),
  paidOrders: z.number(),
});
export type RevenueMonth = z.infer<typeof revenueMonthSchema>;

export const topCourseSchema = z.object({
  courseId: z.string(),
  title: z.string().catch(''),
  batchNumber: z.string().catch(''),
  revenue: z.number(),
  orders: z.number(),
});
export type TopCourse = z.infer<typeof topCourseSchema>;

/** GET /api/revenue/breakdown: totals of the filtered orders and the 5 best-selling courses */
export const revenueBreakdownSchema = z.object({
  orders: z.number(),
  paidOrders: z.number(),
  freeOrders: z.number(),
  subscriptionOrders: z.number(),
  revenue: z.number(),
  vat: z.number(),
  netRevenue: z.number(),
  listTotal: z.number(),
  discountTotal: z.number(),
  topCourses: z.array(topCourseSchema),
});
export type RevenueBreakdown = z.infer<typeof revenueBreakdownSchema>;
