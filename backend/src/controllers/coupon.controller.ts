import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Coupon, type ICoupon } from '../models/Coupon.model';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Promo } from '../models/Promo.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { assertCodeFree, normalizeCode, parseDiscount, suggestCode } from '../utils/couponCode';
import { courseListPrice, publicOffer, resolveCoupon } from '../utils/courseOffer';

const USAGE_LIMIT_MAX = 100000;

const assertId = (value: unknown, label: string): string => {
	if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) throw new AppError(`Invalid ${label}`, 400);
	return value;
};

const parseDate = (value: unknown, label: string): Date | null => {
	if (value === undefined || value === null || value === '') return null;
	const date = typeof value === 'string' ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) throw new AppError(`Invalid ${label}`, 400);
	return date;
};

const parseUsageLimit = (value: unknown): number | null => {
	if (value === undefined || value === null || value === '') return null;
	const limit = typeof value === 'string' ? Number(value) : value;
	if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > USAGE_LIMIT_MAX)
		throw new AppError('Usage limit must be a whole number from 1, or empty for unlimited', 400);
	return limit;
};

const assertDateRange = (startsAt: Date | null | undefined, endsAt: Date | null | undefined): void => {
	if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime())
		throw new AppError('The end date must be after the start date', 400);
};

type CouponStatus = 'active' | 'scheduled' | 'expired' | 'inactive' | 'used-up';

const statusOf = (
	item: { isActive: boolean; startsAt?: Date | null; endsAt?: Date | null; usageLimit?: number | null },
	usedCount: number,
	now: Date,
): CouponStatus => {
	if (!item.isActive) return 'inactive';
	if (item.endsAt && item.endsAt.getTime() <= now.getTime()) return 'expired';
	if (item.usageLimit && usedCount >= item.usageLimit) return 'used-up';
	if (item.startsAt && item.startsAt.getTime() > now.getTime()) return 'scheduled';
	return 'active';
};

/** Enrolments per coupon code of one course (the "students used it" column). */
const usageByCode = async (courseId: Types.ObjectId): Promise<Map<string, number>> => {
	const rows = await Enrollment.aggregate<{ _id: string; count: number }>([
		{ $match: { course: courseId, couponCode: { $type: 'string' } } },
		{ $group: { _id: '$couponCode', count: { $sum: 1 } } },
	]);
	return new Map(rows.map((row) => [row._id, row.count]));
};

/**
 * GET /api/coupons?course=<id>: every code of the course: its own discount (the auto coupon from the Pricing
 * page), its coupons and the promos that include it, each with status and how many students used it.
 */
export const getCourseCoupons = asyncHandler(async (req: Request, res: Response) => {
	const courseId = new Types.ObjectId(assertId(req.query.course, 'course id'));
	const course = await Course.findById(courseId)
		.select('pricing price listPrice discountPrice discountCode discountStartsAt discountEndsAt')
		.lean();
	if (!course) throw new AppError('Course not found', 404);
	const [coupons, promos, usage] = await Promise.all([
		Coupon.find({ course: courseId }).sort({ createdAt: -1 }).lean(),
		Promo.find({ courses: courseId }).select('title code discountType value startsAt endsAt isActive').sort({ createdAt: -1 }).lean(),
		usageByCode(courseId),
	]);
	const now = new Date();
	const listPrice = courseListPrice(course);
	const items: Record<string, unknown>[] = [];
	if (course.discountCode && course.pricing === 'Paid' && (course.discountPrice ?? listPrice) < listPrice) {
		const used = usage.get(course.discountCode) ?? 0;
		const auto = {
			isActive: true,
			startsAt: course.discountStartsAt ?? null,
			endsAt: course.discountEndsAt ?? null,
			usageLimit: null,
		};
		items.push({
			_id: `course-${String(course._id)}`,
			kind: 'auto',
			code: course.discountCode,
			discountType: 'amount',
			value: Math.round((listPrice - (course.discountPrice ?? listPrice)) * 100) / 100,
			...auto,
			usedCount: used,
			status: statusOf(auto, used, now),
		});
	}
	for (const coupon of coupons) {
		const used = usage.get(coupon.code) ?? 0;
		items.push({ ...coupon, kind: 'coupon', usedCount: used, status: statusOf(coupon, used, now) });
	}
	for (const promo of promos) {
		const used = usage.get(promo.code) ?? 0;
		items.push({ ...promo, kind: 'promo', usageLimit: null, usedCount: used, status: statusOf(promo, used, now) });
	}
	res.status(200).json({ success: true, data: items, total: items.length });
});

/** GET /api/coupons/suggest: a free random code for the form. */
export const suggestCouponCode = asyncHandler(async (_req: Request, res: Response) => {
	res.status(200).json({ success: true, data: { code: await suggestCode() } });
});

/** The coupon fields of a create / update body (partial on update). */
const parseCouponBody = async (
	body: Record<string, unknown>,
	listPrice: number,
	current?: ICoupon,
): Promise<Partial<ICoupon>> => {
	const fields: Partial<ICoupon> = {};
	if (body.code !== undefined || !current) {
		const code = normalizeCode(body.code);
		if (code !== current?.code) await assertCodeFree(code, { couponId: current?._id });
		fields.code = code;
	}
	if (body.discountType !== undefined || body.value !== undefined || !current) {
		const discount = parseDiscount(body.discountType ?? current?.discountType, body.value ?? current?.value);
		if (discount.discountType === 'amount' && discount.value >= listPrice)
			throw new AppError('The discount must be less than the list price', 400);
		Object.assign(fields, discount);
	}
	if (body.startsAt !== undefined) fields.startsAt = parseDate(body.startsAt, 'start date') ?? undefined;
	if (body.endsAt !== undefined) fields.endsAt = parseDate(body.endsAt, 'end date') ?? undefined;
	if (body.usageLimit !== undefined) fields.usageLimit = parseUsageLimit(body.usageLimit);
	if (body.isActive !== undefined) {
		if (typeof body.isActive !== 'boolean') throw new AppError('isActive must be true or false', 400);
		fields.isActive = body.isActive;
	}
	const startsAt = body.startsAt !== undefined ? fields.startsAt : current?.startsAt;
	const endsAt = body.endsAt !== undefined ? fields.endsAt : current?.endsAt;
	assertDateRange(startsAt, endsAt);
	return fields;
};

/** POST /api/coupons: a new coupon for a paid course. */
export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
	const body = req.body as Record<string, unknown>;
	const courseId = assertId(body.course, 'course id');
	const course = await Course.findById(courseId).select('pricing price listPrice').lean();
	if (!course) throw new AppError('Course not found', 404);
	if (course.pricing !== 'Paid') throw new AppError('Coupons are only for paid courses', 400);
	const fields = await parseCouponBody(body, courseListPrice(course));
	const coupon = await Coupon.create({ ...fields, course: course._id, createdBy: req.user._id });
	res.status(201).json({ success: true, message: 'Coupon created', data: coupon });
});

/** PATCH /api/coupons/:id: change any field, or switch it on / off. */
export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
	const coupon = await Coupon.findById(assertId(req.params.id, 'coupon id'));
	if (!coupon) throw new AppError('Coupon not found', 404);
	const course = await Course.findById(coupon.course).select('pricing price listPrice').lean();
	if (!course) throw new AppError('Course not found', 404);
	const body = req.body as Record<string, unknown>;
	const fields = await parseCouponBody(body, courseListPrice(course), coupon);
	coupon.set(fields);
	// An empty date clears it
	if (body.startsAt === '' || body.startsAt === null) coupon.set('startsAt', undefined);
	if (body.endsAt === '' || body.endsAt === null) coupon.set('endsAt', undefined);
	await coupon.save();
	res.status(200).json({ success: true, message: 'Coupon updated', data: coupon });
});

/** DELETE /api/coupons/:id: only a coupon nobody enrolled with (otherwise switch it off). */
export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
	const coupon = await Coupon.findById(assertId(req.params.id, 'coupon id'));
	if (!coupon) throw new AppError('Coupon not found', 404);
	const used = await Enrollment.countDocuments({ course: coupon.course, couponCode: coupon.code });
	if (used > 0) throw new AppError('This coupon was used by students; switch it off instead of deleting', 400);
	await coupon.deleteOne();
	res.status(200).json({ success: true, message: 'Coupon deleted' });
});

/**
 * GET /api/coupons/check?course=<id>&code=<code> (public): what the code gives on the course right now, for the
 * course and payment pages. The price is only a preview: the enrolment checks the code again.
 */
export const checkCoupon = asyncHandler(async (req: Request, res: Response) => {
	const courseId = assertId(req.query.course, 'course id');
	if (typeof req.query.code !== 'string' || req.query.code.length > 40) throw new AppError('Invalid coupon code', 400);
	const course = await Course.findOne({ _id: courseId, status: 'Published', visibility: 'Public' })
		.select('pricing price listPrice discountPrice discountCode discountStartsAt discountEndsAt')
		.lean();
	if (!course) throw new AppError('Course not found', 404);
	const offer = await resolveCoupon(course, req.query.code);
	res.status(200).json({ success: true, data: publicOffer(offer) });
});
