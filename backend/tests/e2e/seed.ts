// Seeds the E2E test database with one account per role (docker/compose.test.yml, profile e2e).
// Run inside the backend-e2e container: npx ts-node --transpile-only tests/e2e/seed.ts
// Test-only accounts and password; refuses to run against a database whose name does not contain "test".
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { User } from '../../src/models/User.model';

import type { UserRole } from '../../src/types/index';

/** Must match frontend/e2e/helpers.ts. */
export const E2E_PASSWORD = 'E2e-test-password-1';
const BCRYPT_ROUNDS = 12;

const ACCOUNTS: { name: string; email: string; role: UserRole }[] = [
  { name: 'E2E Super Admin', email: 'e2e.superadmin@example.com', role: 'Super Admin' },
  { name: 'E2E Admin', email: 'e2e.admin@example.com', role: 'Admin' },
  { name: 'E2E Moderator', email: 'e2e.moderator@example.com', role: 'Moderator' },
  { name: 'E2E Teacher', email: 'e2e.teacher@example.com', role: 'Teacher' },
  { name: 'E2E Student', email: 'e2e.student@example.com', role: 'Student' },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri || !/test/i.test(new URL(uri).pathname)) {
    throw new Error(
      'E2E seed needs MONGO_URI pointing at a test database (name containing "test").',
    );
  }
  await mongoose.connect(uri);
  const password = await bcrypt.hash(E2E_PASSWORD, BCRYPT_ROUNDS);
  for (const account of ACCOUNTS) {
    await User.updateOne(
      { email: account.email },
      { $set: { ...account, password } },
      { upsert: true },
    );
  }
  await mongoose.disconnect();
  process.stdout.write(`E2E seed: ${ACCOUNTS.length} accounts ready\n`);
}

seed().catch((error: unknown) => {
  process.stderr.write(`E2E seed failed: ${String(error)}\n`);
  process.exit(1);
});
