import { DateTime, IANAZone } from 'luxon';
import { AppError } from './AppError';

// Report periods (today, last 7 days, this month, custom days) and chart buckets, in the viewer's time zone.
// The browser sends its IANA zone as ?tz= (e.g. Asia/Dhaka); without it the periods are in UTC.

export const DEFAULT_TIME_ZONE = 'UTC';
/** "Last 7 days" = today and the 6 days before it */
const WEEK_DAYS = 7;
/** A custom range longer than this is charted per month instead of per day */
export const MAX_DAILY_BUCKETS = 92;
/** Longest custom range accepted (about ten years) */
const MAX_CUSTOM_DAYS = 3660;
const DAY_FORMAT = 'yyyy-MM-dd';
const MONTH_FORMAT = 'yyyy-MM';
const HOUR_FORMAT = "yyyy-MM-dd'T'HH";

export type Granularity = 'hour' | 'day' | 'month';

/** The ?tz= value when it is a real IANA zone; 400 for anything else that was sent. */
export const resolveTimeZone = (value: unknown): string => {
	if (value === undefined || value === '') return DEFAULT_TIME_ZONE;
	if (typeof value !== 'string' || !IANAZone.isValidZone(value)) throw new AppError('Invalid time zone', 400);
	return value;
};

export interface PeriodStarts {
	today: Date;
	week: Date;
	month: Date;
}

/** Start of today, of the last 7 days (today included) and of this calendar month, in the zone. */
export const periodStarts = (zone: string, now: DateTime = DateTime.now()): PeriodStarts => {
	const today = now.setZone(zone).startOf('day');
	return {
		today: today.toJSDate(),
		week: today.minus({ days: WEEK_DAYS - 1 }).toJSDate(),
		month: today.startOf('month').toJSDate(),
	};
};

/** The bucket a moment falls in: "2026-11-02T09" (hour), "2026-11-02" (day) or "2026-11" (month). */
export const bucketKey = (date: Date, zone: string, granularity: Granularity): string => {
	const local = DateTime.fromJSDate(date, { zone });
	if (granularity === 'hour') return local.toFormat(HOUR_FORMAT);
	return local.toFormat(granularity === 'day' ? DAY_FORMAT : MONTH_FORMAT);
};

/** Every bucket from start to end (both included), oldest first. */
export const bucketKeys = (start: Date, end: Date, zone: string, granularity: Granularity): string[] => {
	const keys: string[] = [];
	const last = DateTime.fromJSDate(end, { zone });
	let cursor = DateTime.fromJSDate(start, { zone }).startOf(granularity);
	while (cursor <= last) {
		keys.push(bucketKey(cursor.toJSDate(), zone, granularity));
		cursor = cursor.plus({ [`${granularity}s`]: 1 });
	}
	return keys;
};

/** A custom range from ?from= and ?to= (yyyy-MM-dd, both days included): 400 when missing, bad or reversed. */
export const customRange = (from: unknown, to: unknown, zone: string): { start: Date; end: Date; days: number } => {
	if (typeof from !== 'string' || typeof to !== 'string') throw new AppError('Start and end dates are required', 400);
	const start = DateTime.fromFormat(from, DAY_FORMAT, { zone });
	const end = DateTime.fromFormat(to, DAY_FORMAT, { zone });
	if (!start.isValid || !end.isValid) throw new AppError('Invalid date', 400);
	if (end < start) throw new AppError('The start date must be before the end date', 400);
	const days = Math.round(end.diff(start, 'days').days) + 1;
	if (days > MAX_CUSTOM_DAYS) throw new AppError('Date range is too long', 400);
	return { start: start.toJSDate(), end: end.endOf('day').toJSDate(), days };
};
