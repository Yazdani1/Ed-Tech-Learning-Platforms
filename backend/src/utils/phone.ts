import { AppError } from './AppError';

// An optional contact phone number on a user account: digits with an optional leading "+", spaces and dashes,
// 6-20 characters in all (the User model's maxlength).
const PHONE_PATTERN = /^(?=.{6,20}$)\+?\d[\d\s-]{4,18}\d$/;

/**
 * The phone number to save: undefined when the field was not sent (keep the current one), '' to remove it,
 * otherwise the trimmed number. 400 for anything that is not a phone number (objects, letters, too long).
 */
export const parsePhone = (value: unknown): string | undefined => {
	if (value === undefined) return undefined;
	if (typeof value !== 'string') throw new AppError('Invalid phone number', 400);
	const phone = value.trim();
	if (phone !== '' && !PHONE_PATTERN.test(phone)) throw new AppError('Invalid phone number', 400);
	return phone;
};
