import './types/express-augmentation';
import path from 'path';
import express, { type Application, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import apiRoutes from './routes/index';

const app: Application = express();

// Allow both localhost:3000 and localhost:3001 for development
const corsOrigins =
	process.env.NODE_ENV === 'production'
		? process.env.CLIENT_URL
		: /^http:\/\/localhost:\d+$/;

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiRoutes);

// Serve built frontend in production; redirect to Vite dev server in development
if (process.env.NODE_ENV === 'production') {
	const distPath = path.join(__dirname, '../../frontend/dist');
	app.use(express.static(distPath));
	app.get('/*path', (_req: Request, res: Response) => {
		res.sendFile(path.join(distPath, 'index.html'));
	});
} else {
	const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
	app.get('/*path', (req: Request, res: Response) => {
		// Only redirect plain page navigations, not API misses
		if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
			res.redirect(`${clientUrl}${req.path}`);
		} else {
			notFound(req, res);
		}
	});
}

app.use(notFound);
app.use(errorHandler);

export default app;
