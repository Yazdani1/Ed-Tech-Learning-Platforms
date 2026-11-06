import type { Types } from 'mongoose';
import { Coupon, type DiscountType, type ICoupon } from '../models/Coupon.model';
import { Promo, type IPromo } from '../models/Promo.model';
import type { CouponSource } from '../models/Enrollment.model';
import { AppError } from './AppError';
import { money } from './revenue';

/** The discount a code gives right now on one course (one coupon per order). */
export interface CourseOffer {
	code: string;
	source: CouponSource;
	/** What the course costs with the code */
	price: number;
	listPrice: number;
	discountAmount: number;
	discountPercent: number;
	startsAt: Date | null;
	endsAt: Date | null;
	/** Set for a course coupon (its use count goes up on enrolment) */
	couponId?: Types.ObjectId;
	usageLimit?: number | null;
}

/** The course fields an offer needs. */
export interface OfferCourse {
	_id: unknown;
	pricing: string;
	price?: number;
	listPrice?: number;
	discountPrice?: number;
	discountCode?: string;
	discountStartsAt?: Date | null;
	discountEndsAt?: Date | null;
}

const PERCENT = 100;

export const courseListPrice = (course: OfferCourse): number =>
	money(Math.max(course.listPrice ?? course.price ?? 0, 0));

/** True while `now` is inside [startsAt, endsAt) (a missing end runs on). */
const isRunning = (startsAt: Date | null | undefined, endsAt: Date | null | undefined, now: Date): boolean =>
	(!startsAt || startsAt.getTime() <= now.getTime()) && (!endsAt || endsAt.getTime() > now.getTime());

/**
 * An amount must stay below the list price (checked when saved too): after the list price was lowered, such a
 * code would make the course free, so it is not valid any more.
 */
const amountStillFits = (listPrice: number, type: DiscountType, value: number): boolean =>
	type !== 'amount' || value < listPrice;

/** The price after a percent or amount discount (never below 0). */
export const discountedPrice = (listPrice: number, type: DiscountType, value: number): number => {
	const off = type === 'percent' ? (listPrice * Math.min(value, PERCENT)) / PERCENT : value;
	return money(Math.max(listPrice - off, 0));
};

const buildOffer = (
	listPrice: number,
	price: number,
	fields: Pick<CourseOffer, 'code' | 'source' | 'startsAt' | 'endsAt' | 'couponId' | 'usageLimit'>,
): CourseOffer => {
	const discountAmount = money(Math.max(listPrice - price, 0));
	return {
		...fields,
		price,
		listPrice,
		discountAmount,
		discountPercent: listPrice > 0 ? Math.round((discountAmount / listPrice) * PERCENT) : 0,
	};
};

/** The course's own discount (its auto coupon) while it runs. */
export const courseDiscountOffer = (course: OfferCourse, now = new Date()): CourseOffer | null => {
	if (course.pricing !== 'Paid' || !course.discountCode) return null;
	const listPrice = courseListPrice(course);
	const price = money(Math.max(course.discountPrice ?? listPrice, 0));
	if (price >= listPrice) return null;
	if (!isRunning(course.discountStartsAt, course.discountEndsAt, now)) return null;
	return buildOffer(listPrice, price, {
		code: course.discountCode,
		source: 'course',
		startsAt: course.discountStartsAt ?? null,
		endsAt: course.discountEndsAt ?? null,
	});
};

type PromoFields = Pick<IPromo, 'code' | 'discountType' | 'value' | 'startsAt' | 'endsAt' | 'courses'>;

const promoOffer = (course: OfferCourse, promo: PromoFields): CourseOffer | null => {
	if (course.pricing !== 'Paid') return null;
	if (!promo.courses.some((id) => String(id) === String(course._id))) return null;
	const listPrice = courseListPrice(course);
	if (!amountStillFits(listPrice, promo.discountType, promo.value)) return null;
	const price = discountedPrice(listPrice, promo.discountType, promo.value);
	if (price >= listPrice) return null;
	return buildOffer(listPrice, price, {
		code: promo.code,
		source: 'promo',
		startsAt: promo.startsAt,
		endsAt: promo.endsAt,
	});
};

/** Promos running now (active, inside their dates), newest first. */
export const loadRunningPromos = (now = new Date()) =>
	Promo.find({ isActive: true, startsAt: { $lte: now }, endsAt: { $gt: now } })
		.select('title code discountType value startsAt endsAt courses')
		.sort({ createdAt: -1 })
		.lean();

/** The code pre-filled for a course: the lowest price of its own discount and the running promos. */
export const bestOffer = (course: OfferCourse, promos: readonly PromoFields[], now = new Date()): CourseOffer | null => {
	const offers = [courseDiscountOffer(course, now), ...promos.map((promo) => promoOffer(course, promo))].filter(
		(offer): offer is CourseOffer => offer !== null,
	);
	return offers.reduce<CourseOffer | null>((best, offer) => (!best || offer.price < best.price ? offer : best), null);
};

/** The public part of an offer (no internal ids or limits). */
export const publicOffer = (offer: CourseOffer | null) =>
	offer
		? {
				code: offer.code,
				source: offer.source,
				price: offer.price,
				listPrice: offer.listPrice,
				discountAmount: offer.discountAmount,
				discountPercent: offer.discountPercent,
				startsAt: offer.startsAt,
				endsAt: offer.endsAt,
			}
		: null;

type Plain = Record<string, unknown>;
interface WithToObject {
	toObject: () => Plain;
}
const toPlain = (course: Plain | WithToObject): Plain =>
	typeof (course as WithToObject).toObject === 'function' ? (course as WithToObject).toObject() : (course as Plain);

/** Public course responses: each course gets `offer` (the code pre-filled on the course and payment pages). */
export const attachOffers = async <T extends Plain | WithToObject>(courses: readonly T[]): Promise<Plain[]> => {
	if (courses.length === 0) return [];
	const now = new Date();
	const promos = await loadRunningPromos(now);
	return courses.map((course) => {
		const plain = toPlain(course);
		return { ...plain, offer: publicOffer(bestOffer(plain as unknown as OfferCourse, promos, now)) };
	});
};

const INVALID_CODE = 'This coupon code is not valid for this course';

/**
 * What a code typed by the buyer gives on this course right now: the course's own discount, one of its
 * active coupons (with uses left) or a running promo that includes it. 400 otherwise (one message for every
 * reason, so codes cannot be probed).
 */
export const resolveCoupon = async (course: OfferCourse, rawCode: string, now = new Date()): Promise<CourseOffer> => {
	if (course.pricing !== 'Paid') throw new AppError(INVALID_CODE, 400);
	const code = rawCode.trim().toUpperCase();
	const own = courseDiscountOffer(course, now);
	if (own && own.code === code) return own;

	const listPrice = courseListPrice(course);
	const couponFilter: Record<string, unknown> = { course: course._id, code, isActive: true };
	const coupon = await Coupon.findOne(couponFilter).lean<ICoupon & { _id: Types.ObjectId }>();
	if (coupon && isRunning(coupon.startsAt, coupon.endsAt, now)) {
		const hasUsesLeft = coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit;
		const price = discountedPrice(listPrice, coupon.discountType, coupon.value);
		if (hasUsesLeft && price < listPrice && amountStillFits(listPrice, coupon.discountType, coupon.value)) {
			return buildOffer(listPrice, price, {
				code,
				source: 'coupon',
				startsAt: coupon.startsAt ?? null,
				endsAt: coupon.endsAt ?? null,
				couponId: coupon._id,
				usageLimit: coupon.usageLimit,
			});
		}
	}

	const promoFilter: Record<string, unknown> = {
		code,
		isActive: true,
		startsAt: { $lte: now },
		endsAt: { $gt: now },
		courses: course._id,
	};
	const promo = await Promo.findOne(promoFilter).lean<IPromo>();
	const offer = promo ? promoOffer(course, promo) : null;
	if (offer) return offer;
	throw new AppError(INVALID_CODE, 400);
};

/**
 * Takes one use of a limited course coupon at enrolment time (atomic: two buyers can never take the last use
 * both). Returns false when no use is left.
 */
export const claimCouponUse = async (offer: CourseOffer): Promise<boolean> => {
	if (offer.source !== 'coupon' || !offer.couponId) return true;
	const claimed = await Coupon.findOneAndUpdate(
		{
			_id: offer.couponId,
			isActive: true,
			$or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
		},
		{ $inc: { usedCount: 1 } },
	);
	return claimed !== null;
};

/** Gives the use back when the enrolment could not be saved after all. */
export const releaseCouponUse = async (offer: CourseOffer): Promise<void> => {
	if (offer.source !== 'coupon' || !offer.couponId) return;
	await Coupon.updateOne({ _id: offer.couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
};
