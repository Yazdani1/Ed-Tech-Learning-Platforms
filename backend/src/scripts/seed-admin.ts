import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { User } from '../models/User.model';

async function seedAdmin() {
  await mongoose.connect(config.mongoUri);

  const email = 'admin@medhabee.com';
  const existing = await User.findOne({ email });

  if (existing) {
    console.log('Super Admin already exists:', email);
    await mongoose.disconnect();
    return;
  }

  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedPassword) throw new Error('Set SEED_ADMIN_PASSWORD to create the Super Admin account');
  const hashed = await bcrypt.hash(seedPassword, 12);
  await User.create({
    name: 'Super Admin',
    email,
    password: hashed,
    role: 'Super Admin',
  });

  console.log('Super Admin created successfully.');
  await mongoose.disconnect();
}

seedAdmin().catch((err) => { console.error(err); process.exit(1); });
