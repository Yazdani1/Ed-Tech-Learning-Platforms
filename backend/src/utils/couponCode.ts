import { randomInt } from 'crypto';
import { Coupon, type DiscountType } from '../models/Coupon.model';
import { Course } from '../models/Course.model';
import { Promo } from '../models/Promo.model';
import { AppError } from './AppError';

/** Letters, digits and dashes, 6-20 characters (stored in upper case; long enough not to be guessed easily). */
const CODE_PATTERN = /^[A-Z0-9-]{6,20}$/;
// No 0/O and 1/I, so a code read aloud or copied by hand stays right
const SUGGEST_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SUGGEST_LENGTH = 8;
const MAX_TRIES = 20;
const PERCENT_MAX = 100;

/** The code from a request, trimmed and upper-cased, or 400. */
export const normalizeCode = (value: unknown): string => {
	if (typeof value !== 'string') throw new AppError('Coupon code must be 6-20 letters, digits or dashes', 400);
	const code = value.trim().toUpperCase();
	if (!CODE_PATTERN.test(code)) throw new AppError('Coupon code must be 6-20 letters, digits or dashes', 400);
	return code;
};

interface CodeOwner {
	courseId?: unknown;
	couponId?: unknown;
	promoId?: unknown;
}

/** True when a course discount, a coupon or a promo already uses the code (the owner being edited excluded). */
export const isCodeTaken = async (code: string, owner: CodeOwner = {}): Promise<boolean> => {
	const except = (id: unknown): Record<string, unknown> => (id ? { _id: { $ne: id } } : {});
	const courseFilter: Record<string, unknown> = { discountCode: code, ...except(owner.courseId) };
	const couponFilter: Record<string, unknown> = { code, ...except(owner.couponId) };
	const promoFilter: Record<string, unknown> = { code, ...except(owner.promoId) };
	const [course, coupon, promo] = await Promise.all([
		Course.exists(courseFilter),
		Coupon.exists(couponFilter),
		Promo.exists(promoFilter),
	]);
	return Boolean(course ?? coupon ?? promo);
};

/** 409 when the code is used anywhere else: every code means exactly one discount. */
export const assertCodeFree = async (code: string, owner: CodeOwner = {}): Promise<void> => {
	if (await isCodeTaken(code, owner)) throw new AppError('This coupon code is already in use', 409);
};

const randomCode = (prefix: string): string => {
	let body = '';
	for (let i = 0; i < SUGGEST_LENGTH; i += 1) body += SUGGEST_ALPHABET[randomInt(SUGGEST_ALPHABET.length)];
	return `${prefix}${body}`;
};

/** A random code nobody uses yet, e.g. "SAVE-7KQ2M9XA". */
export const suggestCode = async (prefix = ''): Promise<string> => {
	for (let tries = 0; tries < MAX_TRIES; tries += 1) {
		const code = randomCode(prefix);
		if (!(await isCodeTaken(code))) return code;
	}
	throw new AppError('Could not suggest a code, please type one', 409);
};

/** Startup: a course discount set before coupons existed becomes the course's auto coupon (it gets a code). */
export const assignMissingDiscountCodes = async (): Promise<number> => {
	const filter: Record<string, unknown> = {
		pricing: 'Paid',
		discountCode: { $exists: false },
		discountPrice: { $type: 'number' },
		listPrice: { $type: 'number' },
		$expr: { $lt: ['$discountPrice', '$listPrice'] },
	};
	const courses = await Course.find(filter)
		.select('_id')
		.lean();
	for (const course of courses) {
		const discountCode = await suggestCode('SAVE-');
		await Course.updateOne({ _id: course._id, discountCode: { $exists: false } }, { $set: { discountCode } });
	}
	return courses.length;
};

/** Percent 1-100 or an amount above 0 (amounts below the list price are checked against the course). */
export const parseDiscount = (type: unknown, value: unknown): { discountType: DiscountType; value: number } => {
	if (type !== 'percent' && type !== 'amount') throw new AppError('Discount type must be percent or amount', 400);
	const amount = typeof value === 'string' ? Number(value) : value;
	if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0)
		throw new AppError('Discount must be a number above 0', 400);
	if (type === 'percent' && amount > PERCENT_MAX) throw new AppError('A percent discount must be 100 or less', 400);
	return { discountType: type, value: Math.round(amount * 100) / 100 };
};

