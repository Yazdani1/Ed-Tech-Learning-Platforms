import { getRedis, isRedisConfigured, redisClient } from '../config/redis';

// Slows down password guessing: after MAX_FAILED_ATTEMPTS wrong passwords for one email, logins for that
// email are refused for LOCK_WINDOW_MS. Kept in Redis when REDIS_URL is set (shared by every instance),
// in memory otherwise. Keyed by email; the per-IP limit is loginLimiter (middleware/rateLimit).
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

export const isLoginLockedInMemory = (email: string, now = Date.now()): boolean =>
  (current(email, now)?.count ?? 0) >= MAX_FAILED_ATTEMPTS;

export const recordFailedLoginInMemory = (email: string, now = Date.now()): void => {
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

const redisKey = (email: string): string => `login-fail:${email}`;

/** Redis when configured and reachable; null means "use memory". */
const redis = async () => {
  if (!isRedisConfigured()) return null;
  try {
    return getRedis() ?? (await redisClient());
  } catch {
    return null;
  }
};

/**
 * Counts one sign-in attempt for the email before the password is checked (cleared again on success) and
 * says whether it may go ahead. One atomic step, so parallel requests cannot all slip past the limit.
 */
export const claimLoginAttempt = async (email: string): Promise<boolean> => {
  const client = await redis();
  if (!client) {
    if (isLoginLockedInMemory(email)) return false;
    recordFailedLoginInMemory(email);
    return true;
  }
  const key = redisKey(email);
  // One transaction: the window starts at the first wrong password (NX keeps it) and a key never stays forever
  const [count] = await client.multi().incr(key).pExpire(key, LOCK_WINDOW_MS, 'NX').exec();
  return Number(count) <= MAX_FAILED_ATTEMPTS;
};

export const clearFailedLogins = async (email: string): Promise<void> => {
  failedLogins.delete(email);
  const client = await redis();
  if (client) await client.del(redisKey(email));
};
