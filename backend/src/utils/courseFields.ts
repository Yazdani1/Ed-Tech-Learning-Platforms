import { AppError } from './AppError';
import { assertBatchNumber, uniqueBatchNumber } from './batchNumber';
import { assertCodeFree, normalizeCode, suggestCode } from './couponCode';

const SCHEDULE_MAX = 200;

/** Live class / support class schedule: plain text up to 200 characters ('' clears it). */
const parseScheduleText = (value: unknown, label: string): string => {
	if (typeof value !== 'string' || value.trim().length > SCHEDULE_MAX)
		throw new AppError(`${label} must be text of at most ${SCHEDULE_MAX} characters`, 400);
	return value.trim();
};

const parseOptionalDate = (value: unknown, label: string): Date | null => {
	if (value === '' || value === null || value === 'null') return null;
	const date = typeof value === 'string' ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) throw new AppError(`Invalid ${label}`, 400);
	return date;
};

export interface CourseExtraFields {
	batchNumber?: string;
	liveClassSchedule?: string;
	supportClassSchedule?: string;
	discountCode?: string | null;
	discountStartsAt?: Date | null;
	discountEndsAt?: Date | null;
}

interface CurrentCourse {
	_id?: unknown;
	discountCode?: string;
	discountStartsAt?: Date | null;
	discountEndsAt?: Date | null;
}

/** Batch number and the two schedules from a create (batch number generated when empty) or update body. */
export const parseCourseInfoFields = async (
	body: Record<string, unknown>,
	current?: CurrentCourse,
): Promise<CourseExtraFields> => {
	const fields: CourseExtraFields = {};
	if (body.batchNumber !== undefined && body.batchNumber !== '') {
		fields.batchNumber = await assertBatchNumber(body.batchNumber, current?._id);
	} else if (!current) {
		fields.batchNumber = await uniqueBatchNumber();
	}
	if (body.liveClassSchedule !== undefined)
		fields.liveClassSchedule = parseScheduleText(body.liveClassSchedule, 'Live class schedule');
	if (body.supportClassSchedule !== undefined)
		fields.supportClassSchedule = parseScheduleText(body.supportClassSchedule, 'Support class schedule');
	return fields;
};

/**
 * The course's own discount = its auto coupon (Pricing page): code, start and end. A running discount always
 * has a code (suggested when empty); without a discount the code is cleared. Dates: the end after the start.
 */
export const parseDiscountFields = async (
	body: Record<string, unknown>,
	hasDiscount: boolean,
	current?: CurrentCourse,
): Promise<CourseExtraFields> => {
	if (!hasDiscount) return { discountCode: null, discountStartsAt: null, discountEndsAt: null };
	const fields: CourseExtraFields = {};
	if (body.discountStartsAt !== undefined)
		fields.discountStartsAt = parseOptionalDate(body.discountStartsAt, 'discount start date');
	if (body.discountEndsAt !== undefined)
		fields.discountEndsAt = parseOptionalDate(body.discountEndsAt, 'discount end date');
	const startsAt = fields.discountStartsAt !== undefined ? fields.discountStartsAt : (current?.discountStartsAt ?? null);
	const endsAt = fields.discountEndsAt !== undefined ? fields.discountEndsAt : (current?.discountEndsAt ?? null);
	if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime())
		throw new AppError('The discount must end after it starts', 400);

	if (body.discountCode !== undefined && body.discountCode !== '') {
		const code = normalizeCode(body.discountCode);
		if (code !== current?.discountCode) await assertCodeFree(code, { courseId: current?._id });
		fields.discountCode = code;
	} else if (!current?.discountCode || body.discountCode === '') {
		fields.discountCode = await suggestCode('SAVE-');
	}
	return fields;
};

/** The fields without the cleared (null) ones, for a new course. */
export const withoutNulls = (fields: CourseExtraFields): Record<string, unknown> =>
	Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== null));
