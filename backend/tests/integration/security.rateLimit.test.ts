import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { config } from '../../src/config/env';
import { getRedis, isRedisConfigured, redisClient } from '../../src/config/redis';
import { createLimiter } from '../../src/middleware/rateLimit.middleware';
import { clientIp } from '../../src/utils/clientIp';
import { claimLoginAttempt, clearFailedLogins } from '../../src/utils/loginThrottle';
import { nextId } from '../factories';

/** A tiny app with one limiter in front of one route (the real limiters are off in tests). */
const limitedApp = (limit: number, by: 'ip' | 'user' = 'ip') => {
  const name = `test-${nextId()}-${Date.now()}`;
  const limited = express();
  limited.set('trust proxy', 1);
  limited.get(
    '/',
    createLimiter({ name, windowMs: 60_000, limit, message: 'Slow down', by }, true),
    (_req, res) => {
      res.json({ success: true });
    },
  );
  return limited;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rate limits', () => {
  it('answers 429 in the API shape after the limit, with standard headers', async () => {
    const limited = limitedApp(2);
    expect((await request(limited).get('/')).status).toBe(200);
    const second = await request(limited).get('/');
    expect(second.status).toBe(200);
    expect(second.headers.ratelimit).toBeDefined();
    const third = await request(limited).get('/');
    expect(third.status).toBe(429);
    expect(third.body).toEqual({ success: false, message: 'Slow down' });
  });

  it('counts each visitor separately', async () => {
    const limited = limitedApp(1);
    expect((await request(limited).get('/').set('X-Forwarded-For', '198.51.100.1')).status).toBe(
      200,
    );
    expect((await request(limited).get('/').set('X-Forwarded-For', '198.51.100.1')).status).toBe(
      429,
    );
    expect((await request(limited).get('/').set('X-Forwarded-For', '198.51.100.2')).status).toBe(
      200,
    );
  });

  it('keeps the counters in Redis when REDIS_URL is set', async () => {
    if (!isRedisConfigured()) return;
    const limited = limitedApp(5);
    await request(limited).get('/').set('X-Forwarded-For', '198.51.100.9');
    const redis = getRedis() ?? (await redisClient());
    const keys = await redis.keys('rl:test-*');
    expect(keys.length).toBeGreaterThan(0);
  });

  it('is off for the real app in tests (every test shares one IP)', () => {
    expect(config.rateLimitEnabled).toBe(false);
  });
});

describe('login lock (per email)', () => {
  it('allows 10 attempts, then locks until cleared', async () => {
    const email = `lock-${nextId()}@example.com`;
    for (let attempt = 0; attempt < 10; attempt += 1)
      expect(await claimLoginAttempt(email)).toBe(true);
    expect(await claimLoginAttempt(email)).toBe(false);
    await clearFailedLogins(email);
    expect(await claimLoginAttempt(email)).toBe(true);
  });

  it('never lets parallel attempts slip past the limit', async () => {
    const email = `race-${nextId()}@example.com`;
    const results = await Promise.all(Array.from({ length: 25 }, () => claimLoginAttempt(email)));
    expect(results.filter(Boolean)).toHaveLength(10);
  });
});

describe('clientIp', () => {
  const fake = (headers: Record<string, string>, ip = '10.0.0.5') =>
    ({
      get: (name: string) => headers[name.toLowerCase()],
      ip,
      socket: {},
    }) as unknown as express.Request;

  it('uses X-Client-IP only with the right shared secret and a real IP', () => {
    vi.spyOn(config, 'proxySharedSecret', 'get').mockReturnValue('right-secret');
    expect(clientIp(fake({ 'x-client-ip': '203.0.113.4', 'x-proxy-secret': 'right-secret' }))).toBe(
      '203.0.113.4',
    );
    expect(clientIp(fake({ 'x-client-ip': '203.0.113.4', 'x-proxy-secret': 'wrong-secret' }))).toBe(
      '10.0.0.5',
    );
    expect(clientIp(fake({ 'x-client-ip': 'not-an-ip', 'x-proxy-secret': 'right-secret' }))).toBe(
      '10.0.0.5',
    );
    expect(clientIp(fake({ 'x-client-ip': '203.0.113.4' }))).toBe('10.0.0.5');
  });

  it('ignores X-Client-IP when no secret is configured', () => {
    vi.spyOn(config, 'proxySharedSecret', 'get').mockReturnValue('');
    expect(clientIp(fake({ 'x-client-ip': '203.0.113.4', 'x-proxy-secret': '' }))).toBe('10.0.0.5');
  });
});

describe('security headers', () => {
  it('sends helmet headers and no X-Powered-By', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('refuses JSON bodies over 1 MB', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(1_100_000) }));
    expect(res.status).toBe(413);
  });
});
