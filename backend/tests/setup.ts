// Global test setup: every test file starts with empty collections in the mongo-test database.
// Test files import the Express app from src/app.ts (no server start); this file owns the connection.
import mongoose from 'mongoose';
import { afterAll, beforeAll } from 'vitest';

const mongoUri = process.env.MONGO_URI;

// Safety net: the tests delete every document, so they refuse to run against a non-test database.
if (!mongoUri || !/test/i.test(new URL(mongoUri).pathname)) {
  throw new Error(
    'Backend tests need MONGO_URI pointing at a test database (name containing "test"). Run `npm run test:backend` from the root.',
  );
}

beforeAll(async () => {
  await mongoose.connect(mongoUri);
  const collections = await mongoose.connection.db?.collections();
  await Promise.all((collections ?? []).map((collection) => collection.deleteMany({})));
  // Models are registered by the time this runs (the test file imported the app), so unique indexes exist.
  await mongoose.connection.syncIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
});
