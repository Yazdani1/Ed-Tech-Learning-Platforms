import 'dotenv/config';
import http from 'http';
import app from './app';
import connectDB from './config/db';
import { config } from './config/env';
import { setupSocketIO } from './socket/index';
import { assignMissingStudentNumbers } from './utils/studentNumber';

const startServer = async (): Promise<void> => {
	await connectDB();
	const httpServer = http.createServer(app);
	setupSocketIO(httpServer);
	httpServer.listen(config.port, () => {
		console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
		// Older students get their number in the background; a failure never stops the server
		assignMissingStudentNumbers().catch((err: Error) => {
			console.error('Assigning student numbers failed:', err.message);
		});
	});
};

startServer().catch((err: Error) => {
	console.error('Failed to start server:', err.message);
	process.exit(1);
});
