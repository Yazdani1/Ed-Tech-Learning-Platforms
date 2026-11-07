import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ipKeyGenerator, rateLimit, type Store } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { config } from '../config/env';
import { isRedisConfigured, redisClient } from '../config/redis';
import { clientIp } from '../utils/clientIp';

// Request limits per visitor (IP) or per signed-in user. Counters live in Redis when REDIS_URL is set (shared by
// every backend instance, kept across restarts) and in memory otherwise. Over the limit: 429 in the API's shape.

const MINUTE_MS = 60 * 1000;

interface LimitOptions {
  /** Redis key prefix, unique per limiter */
  name: string;
  windowMs: number;
  limit: number;
  message: string;
  /** 'user' counts per signed-in user (after protect), falling back to the IP */
  by?: 'ip' | 'user';
  /** Only failed requests count (e.g. wrong passwords) */
  skipSuccessfulRequests?: boolean;
}

const ipKey = (req: Request): string => ipKeyGenerator(clientIp(req));

/** Redis when configured (connects on first use), memory otherwise. */
const storeFor = (name: string): Store | undefined =>
  isRedisConfigured()
    ? new RedisStore({
        prefix: `rl:${name}:`,
        sendCommand: async (...args: string[]) => (await redisClient()).sendCommand(args) as Promise<RedisReply>,
      })
    : undefined;

/** Builds one limiter; `enabled` is for tests that check the limiter itself. */
export const createLimiter = (options: LimitOptions, enabled = config.rateLimitEnabled): RequestHandler => {
  const usable = enabled && (options.by === 'user' || config.ipRateLimitEnabled);
  if (!usable) return (_req: Request, _res: Response, next: NextFunction) => next();
  const store = storeFor(options.name);
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    ...(store ? { store } : {}),
    // Redis down: let the request through rather than take the site down with it
    passOnStoreError: true,
    keyGenerator: (req) => (options.by === 'user' && req.user ? `user:${String(req.user._id)}` : `ip:${ipKey(req)}`),
    handler: (_req, res) => {
      res.status(429).json({ success: false, message: options.message });
    },
  });
};

if (config.nodeEnv === 'production' && !config.ipRateLimitEnabled)
  console.warn('PROXY_SHARED_SECRET is not set: per-IP rate limits are off (set the same value on Vercel and Render).');

const TOO_MANY = 'Too many requests. Please wait a little and try again.';

/** Every /api request: a generous ceiling against scraping and floods. */
export const apiLimiter = createLimiter({ name: 'api', windowMs: 5 * MINUTE_MS, limit: 1500, message: TOO_MANY });

/** Sign-in attempts per IP (the per-email lock in utils/loginThrottle comes on top). */
export const loginLimiter = createLimiter({
  name: 'login',
  windowMs: 15 * MINUTE_MS,
  limit: 30,
  skipSuccessfulRequests: true,
  message: 'Too many sign-in attempts. Please try again in 15 minutes.',
});

/** New accounts per IP. */
export const registerLimiter = createLimiter({
  name: 'register',
  windowMs: 60 * MINUTE_MS,
  limit: 10,
  message: 'Too many accounts created. Please try again later.',
});

/** Profile and password changes per user. */
export const accountLimiter = createLimiter({
  name: 'account',
  windowMs: 15 * MINUTE_MS,
  limit: 20,
  by: 'user',
  message: TOO_MANY,
});

/** Coupon code guesses per IP (course and payment pages). */
export const couponCheckLimiter = createLimiter({
  name: 'coupon-check',
  windowMs: 10 * MINUTE_MS,
  limit: 60,
  message: 'Too many coupon checks. Please wait a few minutes.',
});

/** Enrolments and subscriptions (payment) per user. */
export const paymentLimiter = createLimiter({
  name: 'payment',
  windowMs: 10 * MINUTE_MS,
  limit: 30,
  by: 'user',
  message: TOO_MANY,
});

/** Quiz answers per user, and free-preview answer checks per IP. */
export const quizAnswerLimiter = createLimiter({
  name: 'quiz-answer',
  windowMs: MINUTE_MS,
  limit: 60,
  by: 'user',
  message: 'You are answering too fast. Please slow down.',
});

/** Portal time reports (one a minute per open tab). */
export const activityLimiter = createLimiter({
  name: 'activity',
  windowMs: MINUTE_MS,
  limit: 10,
  by: 'user',
  message: TOO_MANY,
});

/** File uploads per visitor (Cloudinary costs); runs before sign-in is checked, so it counts per IP. */
export const uploadLimiter = createLimiter({
  name: 'upload',
  windowMs: 15 * MINUTE_MS,
  limit: 100,
  message: 'Too many uploads. Please try again later.',
});
