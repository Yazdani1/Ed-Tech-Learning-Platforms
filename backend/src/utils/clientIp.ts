import { timingSafeEqual } from 'crypto';
import { isIP } from 'net';
import type { Request } from 'express';
import { config } from '../config/env';

const CLIENT_IP_HEADER = 'x-client-ip';
const PROXY_SECRET_HEADER = 'x-proxy-secret';

const sameSecret = (sent: string, expected: string): boolean => {
  const a = Buffer.from(sent);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * The visitor's IP for rate limits. Calls through the Next.js app carry it in X-Client-IP, trusted only
 * together with the shared proxy secret (anyone can send the header itself). Everything else uses req.ip
 * (one trusted proxy hop: Render).
 */
export const clientIp = (req: Request): string => {
  const secret = config.proxySharedSecret;
  const sentSecret = req.get(PROXY_SECRET_HEADER);
  const forwarded = req.get(CLIENT_IP_HEADER)?.trim();
  if (secret && sentSecret && forwarded && isIP(forwarded) && sameSecret(sentSecret, secret)) return forwarded;
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
};
