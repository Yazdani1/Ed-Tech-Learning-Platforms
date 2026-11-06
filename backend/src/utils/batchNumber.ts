import { Course } from '../models/Course.model';
import { AppError } from './AppError';

const BATCH_PATTERN = /^\d{4}$/;
const MIN_BATCH = 1000;
const BATCH_RANGE = 9000;
const MAX_TRIES = 50;

const randomBatchNumber = (): string => String(MIN_BATCH + Math.floor(Math.random() * BATCH_RANGE));

/** A 4-digit batch number no course uses yet. */
export const uniqueBatchNumber = async (): Promise<string> => {
	for (let tries = 0; tries < MAX_TRIES; tries += 1) {
		const candidate = randomBatchNumber();
		if (!(await Course.exists({ batchNumber: candidate }))) return candidate;
	}
	throw new AppError('Could not find a free batch number, please enter one', 409);
};

/**
 * A batch number from the request: exactly 4 digits and not used by another course (400 / 409).
 * `exceptCourseId` is the course being edited.
 */
export const assertBatchNumber = async (value: unknown, exceptCourseId?: unknown): Promise<string> => {
	if (typeof value !== 'string' || !BATCH_PATTERN.test(value.trim()))
		throw new AppError('Batch number must be exactly 4 digits', 400);
	const batchNumber = value.trim();
	const filter: Record<string, unknown> = { batchNumber };
	if (exceptCourseId) filter._id = { $ne: exceptCourseId };
	if (await Course.exists(filter)) throw new AppError('This batch number is already used by another course', 409);
	return batchNumber;
};

/** Startup: batch numbers for courses created before batch numbers existed, and the first-published mark. */
export const backfillCourseFields = async (): Promise<number> => {
	const courses = await Course.find({ batchNumber: { $exists: false } }).select('_id').lean();
	for (const course of courses) {
		const batchNumber = await uniqueBatchNumber();
		await Course.updateOne({ _id: course._id, batchNumber: { $exists: false } }, { $set: { batchNumber } });
	}
	// A course published before the "never delete a published course" rule keeps that history
	await Course.updateMany(
		{ firstPublishedAt: { $exists: false }, publishedAt: { $type: 'date' } },
		[{ $set: { firstPublishedAt: '$publishedAt' } }],
	);
	return courses.length;
};
