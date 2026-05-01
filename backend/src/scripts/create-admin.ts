import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db';
import { User } from '../models/User.model';

const EMAIL = 'test-admin@medhabee.com';
const PASSWORD = 'Admin@1234';
const NAME = 'Test Super Admin';

const createAdmin = async (): Promise<void> => {
	await connectDB();

	const existing = await User.findOne({ email: EMAIL });
	if (existing) {
		console.log(`User with email ${EMAIL} already exists.`);
		process.exit(0);
	}

	const hashedPassword = await bcrypt.hash(PASSWORD, 12);

	const user = await User.create({
		name: NAME,
		email: EMAIL,
		password: hashedPassword,
		role: 'Super Admin',
	});

	console.log('Super Admin created:');
	console.log({
		id: user._id.toString(),
		name: user.name,
		email: user.email,
		role: user.role,
		password: PASSWORD,
	});
	process.exit(0);
};

createAdmin().catch((error) => {
	console.error('Failed to create Super Admin user:', error);
	process.exit(1);
});
