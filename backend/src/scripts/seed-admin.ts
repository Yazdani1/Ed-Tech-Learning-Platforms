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

  const hashed = await bcrypt.hash('Admin@1234', 12);
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
