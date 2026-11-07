import dotenv from 'dotenv';

dotenv.config();

// Tokens signed with a known default secret could be forged: production refuses to start without one.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/medhabee_db',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  /** Optional: rate limits, login locks and Socket.io rooms are shared through Redis when set */
  redisUrl: process.env.REDIS_URL || '',
  /**
   * Optional: the Next.js app sends the visitor's IP in X-Client-IP together with this secret (the API is
   * reached through Vercel, so req.ip is Vercel's address). Without it the limits use req.ip.
   */
  proxySharedSecret: process.env.PROXY_SHARED_SECRET || '',
  /** Rate limits are off in automated tests (every test shares one IP) unless RATE_LIMIT_IN_TESTS=true */
  rateLimitEnabled: process.env.NODE_ENV !== 'test' || process.env.RATE_LIMIT_IN_TESTS === 'true',
  /**
   * Per-IP limits need the real visitor IP. In production every call arrives from Vercel, so without the
   * shared secret all visitors would share one IP (one attacker could lock sign-in for everybody): the per-IP
   * limits are then off; the per-email login lock and the per-user limits stay on.
   */
  ipRateLimitEnabled: process.env.NODE_ENV !== 'production' || Boolean(process.env.PROXY_SHARED_SECRET),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};
