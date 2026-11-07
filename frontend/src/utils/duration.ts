import type { TFunction } from 'i18next';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/** Time spent as "12 h 5 min", "45 min" or "0 min" (common.duration keys). */
export const formatDuration = (t: TFunction, totalSeconds: number): string => {
  const minutes = Math.floor(Math.max(totalSeconds, 0) / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) return t('common.duration.minutes', { minutes: rest });
  return t('common.duration.hoursMinutes', { hours, minutes: rest });
};
