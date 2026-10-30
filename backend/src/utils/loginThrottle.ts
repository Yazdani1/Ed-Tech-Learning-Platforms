// Slows down password guessing: after MAX_FAILED_ATTEMPTS wrong passwords for one email, logins for that
// email are refused for LOCK_WINDOW_MS. Kept in memory (one backend instance on Render). Keyed by email,
// not IP, because every request reaches the API through the same proxies.
const MAX_FAILED_ATTEMPTS = 10;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_EMAILS = 10_000;

interface Attempts {
  count: number;
  firstAt: number;
}

const failedLogins = new Map<string, Attempts>();

const current = (email: string, now: number): Attempts | undefined => {
  const entry = failedLogins.get(email);
  if (entry && now - entry.firstAt > LOCK_WINDOW_MS) {
    failedLogins.delete(email);
    return undefined;
  }
  return entry;
};

export const isLoginLocked = (email: string, now = Date.now()): boolean =>
  (current(email, now)?.count ?? 0) >= MAX_FAILED_ATTEMPTS;

export const recordFailedLogin = (email: string, now = Date.now()): void => {
  const entry = current(email, now);
  if (entry) {
    entry.count += 1;
    return;
  }
  // Memory bound: drop the oldest entry when full (Map keeps insertion order)
  if (failedLogins.size >= MAX_TRACKED_EMAILS) {
    const oldest = failedLogins.keys().next().value;
    if (oldest !== undefined) failedLogins.delete(oldest);
  }
  failedLogins.set(email, { count: 1, firstAt: now });
};

export const clearFailedLogins = (email: string): void => {
  failedLogins.delete(email);
};
