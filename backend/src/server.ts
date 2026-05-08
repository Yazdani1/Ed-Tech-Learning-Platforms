import 'dotenv/config';
import http from 'http';
import app from './app';
import connectDB from './config/db';
import { config } from './config/env';
import { setupSocketIO } from './socket/index';

const startServer = async (): Promise<void> => {
	await connectDB();
	const httpServer = http.createServer(app);
	setupSocketIO(httpServer);
	httpServer.listen(config.port, () => {
		console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
	});
};

startServer().catch((err: Error) => {
	console.error('Failed to start server:', err.message);
	process.exit(1);
});
