import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import type { IUser } from '../models/User.model';
import { config } from '../config/env';

const VISITOR_COOKIE = 'vid';
const VISITOR_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const VISITOR_PATTERN = /^[0-9a-f-]{36}$/;

/** The guest's anonymous visitor id from the `vid` cookie, or null. */
export const visitorFromCookie = (req: Request): string | null => {
	const cookies = req.cookies as Record<string, unknown> | undefined;
	const value = cookies?.[VISITOR_COOKIE];
	return typeof value === 'string' && VISITOR_PATTERN.test(value) ? value : null;
};

/**
 * Gives a guest an anonymous random `vid` cookie (httpOnly, one year) when it has none. Set when a course is
 * read, so the course page's view request (sent after the course loaded) already carries it.
 */
export const ensureVisitorCookie = (req: Request, res: Response): void => {
	if (req.user as IUser | undefined) return;
	if (visitorFromCookie(req)) return;
	const production = config.nodeEnv === 'production';
	res.cookie(VISITOR_COOKIE, randomUUID(), {
		httpOnly: true,
		secure: production,
		sameSite: production ? 'none' : 'lax',
		maxAge: VISITOR_COOKIE_MAX_AGE_MS,
	});
};
