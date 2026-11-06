// Factories for the pricing tests: paid courses, coupons, promos and paid enrolments with coupon data.
import { Coupon } from '../../src/models/Coupon.model';
import { Enrollment, type EnrollmentType } from '../../src/models/Enrollment.model';
import { Promo } from '../../src/models/Promo.model';
import { createCourse, createUser, nextId } from './index';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
export const LIST_PRICE = 1000;

export const hoursFromNow = (hours: number): Date => new Date(Date.now() + hours * HOUR_MS);

/** A published public paid course (list price 1000, no discount unless overridden). */
export const createPaidCourse = (overrides: Partial<ICourse> = {}): Promise<ICourse> =>
  createCourse({
    pricing: 'Paid',
    listPrice: LIST_PRICE,
    price: LIST_PRICE,
    discountPrice: LIST_PRICE,
    ...overrides,
  });

/** A paid course with its own running discount (auto coupon). */
export const createDiscountedCourse = (
  discountPrice: number,
  discountCode: string,
  overrides: Partial<ICourse> = {},
): Promise<ICourse> =>
  createPaidCourse({ price: discountPrice, discountPrice, discountCode, ...overrides });

export const uniqueCode = (prefix = 'CODE'): string => `${prefix}-${nextId()}${nextId()}`;

export const createCouponDoc = async (
  course: ICourse,
  overrides: Record<string, unknown> = {},
  creator?: IUser,
) =>
  Coupon.create({
    course: course._id,
    code: uniqueCode('COUP'),
    discountType: 'percent',
    value: 10,
    createdBy: (creator ?? (await createUser('Admin')))._id,
    ...overrides,
  });

export const createPromoDoc = async (
  courses: ICourse[],
  overrides: Record<string, unknown> = {},
  creator?: IUser,
) =>
  Promo.create({
    title: `Promo ${nextId()}`,
    code: uniqueCode('PROMO'),
    discountType: 'percent',
    value: 20,
    startsAt: hoursFromNow(-1),
    endsAt: hoursFromNow(24),
    courses: courses.map((course) => course._id),
    createdBy: (creator ?? (await createUser('Admin')))._id,
    ...overrides,
  });

export const createOrder = (
  student: IUser,
  course: ICourse,
  overrides: Record<string, unknown> = {},
) =>
  Enrollment.create({
    student: student._id,
    course: course._id,
    enrollmentType: 'paid' as EnrollmentType,
    listPrice: LIST_PRICE,
    paidPrice: LIST_PRICE,
    ...overrides,
  });
