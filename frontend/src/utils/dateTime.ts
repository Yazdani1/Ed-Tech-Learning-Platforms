// Dates and times: the backend stores UTC; everything is shown in the viewer's own (browser) time zone.
import { DateTime } from 'luxon';

type DateInput = string | Date | null | undefined;

const toLocal = (value: DateInput, locale?: string): DateTime | null => {
  if (!value) return null;
  const parsed =
    value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromISO(value, { setZone: true });
  if (!parsed.isValid) return null;
  const local = parsed.toLocal();
  return locale ? local.setLocale(locale) : local;
};

/** "Oct 29, 2026" (empty for a missing or invalid value) */
export const formatDate = (value: DateInput, locale?: string): string =>
  toLocal(value, locale)?.toLocaleString(DateTime.DATE_MED) ?? '';

/** The moment has passed (false for a missing or invalid value). */
export const isInPast = (value: DateInput): boolean => {
  const local = toLocal(value);
  return local !== null && local <= DateTime.local();
};

/** "Oct 29, 2026, 3:45 PM" */
export const formatDateTime = (value: DateInput, locale?: string): string =>
  toLocal(value, locale)?.toLocaleString(DateTime.DATETIME_MED) ?? '';

/** "3:45 PM" */
export const formatTime = (value: DateInput, locale?: string): string =>
  toLocal(value, locale)?.toLocaleString(DateTime.TIME_SIMPLE) ?? '';

/** "5 minutes ago", "in 2 days" */
export const formatRelative = (value: DateInput, locale?: string): string =>
  toLocal(value, locale)?.toRelative() ?? '';

/** Value for <input type="datetime-local"> in the viewer's zone ("2026-10-29T15:45"). */
export const toDateTimeInput = (value: DateInput): string =>
  toLocal(value)?.toFormat("yyyy-LL-dd'T'HH:mm") ?? '';

/** Value for <input type="date"> in the viewer's zone ("2026-10-29"). */
export const toDateInput = (value: DateInput): string =>
  toLocal(value)?.toFormat('yyyy-LL-dd') ?? '';

/** A datetime-local / date input value (viewer's zone) as a UTC ISO string for the API; null when empty. */
export const fromLocalInput = (value: string): string | null => {
  if (!value) return null;
  const parsed = DateTime.fromISO(value);
  return parsed.isValid ? parsed.toUTC().toISO() : null;
};

/** Live-class style values stored as plain "yyyy-MM-dd" / "HH:mm" strings (no zone): shown as written. */
export const formatPlainDate = (value: string | null | undefined, locale?: string): string => {
  if (!value) return '';
  const parsed = DateTime.fromISO(value, { locale });
  return parsed.isValid ? parsed.toFormat('cccc, MMM d, yyyy') : value;
};

export const formatPlainTime = (value: string | null | undefined, locale?: string): string => {
  if (!value) return '';
  const parsed = DateTime.fromFormat(value, 'HH:mm', { locale });
  if (parsed.isValid) return parsed.toFormat('h:mm a');
  const iso = DateTime.fromISO(value, { locale });
  return iso.isValid ? iso.toFormat('h:mm a') : value;
};

/** The viewer's IANA time zone ("Asia/Dhaka"); reports send it so "today" means the viewer's today. */
export const viewerTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Today in the viewer's zone as "yyyy-MM-dd" (the max of a report's date inputs). */
export const todayDateInput = (): string => DateTime.local().toFormat('yyyy-LL-dd');

/** True for a real "yyyy-MM-dd" day. */
export const isDateInput = (value: string): boolean =>
  DateTime.fromFormat(value, 'yyyy-LL-dd').isValid;

/**
 * A report bucket key from the server, already in the viewer's zone, as a short axis label:
 * "2026-11-02T09" -> "9 AM", "2026-11-02" -> "Nov 2", "2026-11" -> "Nov 2026".
 */
export const formatBucketLabel = (
  key: string,
  granularity: 'hour' | 'day' | 'month',
  locale?: string,
): string => {
  const formats = { hour: "yyyy-LL-dd'T'HH", day: 'yyyy-LL-dd', month: 'yyyy-LL' } as const;
  const parsed = DateTime.fromFormat(key, formats[granularity], { locale });
  if (!parsed.isValid) return key;
  if (granularity === 'hour') return parsed.toFormat('h a');
  return parsed.toFormat(granularity === 'day' ? 'LLL d' : 'LLL yyyy');
};
