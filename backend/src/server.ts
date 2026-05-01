import 'dotenv/config';
import app from './app';
import connectDB from './config/db';
import { config } from './config/env';

const startServer = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  });
};

startServer().catch((err: Error) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
