const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;

export interface RemainingParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Splits a remaining time (milliseconds, never below 0) into days, hours, minutes and seconds. */
export const splitRemaining = (milliseconds: number): RemainingParts => {
  const total = Math.max(Math.floor(milliseconds / MS_PER_SECOND), 0);
  return {
    days: Math.floor(total / SECONDS_PER_DAY),
    hours: Math.floor((total % SECONDS_PER_DAY) / SECONDS_PER_HOUR),
    minutes: Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: total % SECONDS_PER_MINUTE,
  };
};
