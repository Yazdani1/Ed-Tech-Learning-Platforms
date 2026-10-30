import './types/express-augmentation';
import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import apiRoutes from './routes/index';

const app: Application = express();

// Render sits in front of the API: one proxy hop is trusted for req.ip / req.secure.
app.set('trust proxy', 1);
app.disable('x-powered-by');

const corsOrigins =
	process.env.NODE_ENV === 'production'
		? config.clientUrl // never undefined (cors would fall back to '*')
		: /^http:\/\/localhost:\d+$/;

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
