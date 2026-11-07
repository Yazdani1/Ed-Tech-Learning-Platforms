import 'dotenv/config';
import http from 'http';
import app from './app';
import connectDB from './config/db';
import { config } from './config/env';
import { setupSocketIO } from './socket/index';
import { connectRedis, getRedis } from './config/redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { assignMissingStudentNumbers } from './utils/studentNumber';
import { backfillCourseFields } from './utils/batchNumber';
import { assignMissingDiscountCodes } from './utils/couponCode';

const startServer = async (): Promise<void> => {
	await connectDB();
	await connectRedis();
	const httpServer = http.createServer(app);
	const io = setupSocketIO(httpServer);
	// Several backend instances share Socket.io rooms (chat, notifications) through Redis
	const redis = getRedis();
	if (redis) {
		const subscriber = redis.duplicate();
		// duplicate() does not copy listeners: without one, a Redis network error would crash the process
		subscriber.on('error', (err: Error) => {
			console.error('Redis subscriber error:', err.message);
		});
		await subscriber.connect();
		io.adapter(createAdapter(redis, subscriber));
	}
	httpServer.listen(config.port, () => {
		console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
		// Older students get their number in the background; a failure never stops the server
		assignMissingStudentNumbers().catch((err: Error) => {
			console.error('Assigning student numbers failed:', err.message);
		});
		// Older courses get a batch number, and an older course discount becomes the course's auto coupon
		backfillCourseFields()
			.then(() => assignMissingDiscountCodes())
			.catch((err: Error) => {
				console.error('Backfilling course fields failed:', err.message);
			});
	});
};

startServer().catch((err: Error) => {
	console.error('Failed to start server:', err.message);
	process.exit(1);
});
