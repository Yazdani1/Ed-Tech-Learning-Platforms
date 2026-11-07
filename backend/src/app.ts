import './types/express-augmentation';
import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { apiLimiter, uploadLimiter } from './middleware/rateLimit.middleware';
import apiRoutes from './routes/index';

const app: Application = express();

// Render sits in front of the API: one proxy hop is trusted for req.ip / req.secure.
app.set('trust proxy', 1);
app.disable('x-powered-by');

const corsOrigins =
	process.env.NODE_ENV === 'production'
		? config.clientUrl // never undefined (cors would fall back to '*')
		: /^http:\/\/localhost:\d+$/;

// Security headers for a JSON API (no pages here: the strict CSP blocks everything a browser could load)
app.use(
	helmet({
		contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
		crossOriginResourcePolicy: { policy: 'same-site' },
	}),
);
app.use(cors({ origin: corsOrigins, credentials: true }));
// Bodies are small JSON forms; files come as multipart (Multer has its own limits)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request limits per visitor (Redis when REDIS_URL is set): every API call, and file uploads on top
app.use('/api', apiLimiter);
app.use('/api', (req, res, next) => {
	if (req.is('multipart/form-data')) uploadLimiter(req, res, next);
	else next();
});
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
