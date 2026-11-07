import { createClient } from 'redis';
import { config } from './env';

// One shared Redis connection (rate limits, login locks, Socket.io adapter) when REDIS_URL is set.
// Without it everything falls back to memory, which is right for a single backend instance.

export type RedisClient = ReturnType<typeof createClient>;

const RECONNECT_MAX_DELAY_MS = 5000;
const RECONNECT_STEP_MS = 200;
/** Start-up gives up (and the server does not start) when Redis does not answer in time */
const STARTUP_TIMEOUT_MS = 10_000;

let connecting: Promise<RedisClient> | null = null;
let connected: RedisClient | null = null;

/** True when REDIS_URL is set (the stores are chosen once, at start-up). */
export const isRedisConfigured = (): boolean => Boolean(config.redisUrl);

/** The connected client, or null before it connected / when Redis is not configured. */
export const getRedis = (): RedisClient | null => connected;

/** Connects once (later calls share the same connection); rejects when Redis is not configured. */
export const redisClient = (): Promise<RedisClient> => {
  if (!config.redisUrl) return Promise.reject(new Error('REDIS_URL is not set'));
  connecting ??= (async () => {
    const redis = createClient({
      url: config.redisUrl,
      socket: { reconnectStrategy: (retries) => Math.min(retries * RECONNECT_STEP_MS, RECONNECT_MAX_DELAY_MS) },
    });
    redis.on('error', (err: Error) => {
      console.error('Redis error:', err.message);
    });
    await redis.connect();
    connected = redis;
    return redis;
  })();
  return connecting;
};

/** Start-up: connect when configured (fail fast on a bad URL), warn in production when not. */
export const connectRedis = async (): Promise<void> => {
  if (!config.redisUrl) {
    if (config.nodeEnv === 'production')
      console.warn('REDIS_URL is not set: rate limits and login locks are kept in memory (one instance only).');
    return;
  }
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Redis did not answer within ${STARTUP_TIMEOUT_MS / 1000} s (REDIS_URL)`));
    }, STARTUP_TIMEOUT_MS);
  });
  try {
    await Promise.race([redisClient(), timeout]);
  } finally {
    clearTimeout(timer);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  const redis = connected;
  connected = null;
  connecting = null;
  if (redis) await redis.quit();
};
