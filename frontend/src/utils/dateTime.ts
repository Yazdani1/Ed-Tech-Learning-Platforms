import { DateTime } from 'luxon';

const toDateTime = (value?: string | Date | null) => {
	if (!value) return null;
	const parsed =
		value instanceof Date
			? DateTime.fromJSDate(value)
			: DateTime.fromISO(value, { setZone: true });

	return parsed.isValid ? parsed.toLocal() : null;
};

export const formatDate = (value?: string | Date | null) =>
	toDateTime(value)?.toFormat('MMM d, yyyy') ?? '';

export const formatDateTime = (value?: string | Date | null) =>
	toDateTime(value)?.toFormat('MMM d, yyyy, h:mm a') ?? '';

export const formatTime = (value?: string | Date | null) =>
	toDateTime(value)?.toFormat('h:mm a') ?? '';

export const formatLiveClassDate = (value?: string | null) => {
	if (!value) return '';
	const parsed = DateTime.fromISO(value);
	return parsed.isValid ? parsed.toFormat('cccc, MMM d, yyyy') : value;
};

export const formatLiveClassTime = (value?: string | null) => {
	if (!value) return '';
	const parsed = DateTime.fromFormat(value, 'HH:mm');
	if (parsed.isValid) return parsed.toFormat('h:mm a');

	const isoParsed = DateTime.fromISO(value);
	return isoParsed.isValid ? isoParsed.toFormat('h:mm a') : value;
};
