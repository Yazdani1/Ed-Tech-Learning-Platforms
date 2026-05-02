import './types/express-augmentation';
import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
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

app.use(notFound);
app.use(errorHandler);

export default app;
