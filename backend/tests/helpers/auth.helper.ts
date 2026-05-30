import bcrypt from 'bcryptjs';
import { User, type IUser } from '../../src/models/User.model';
import { generateToken } from '../../src/utils/jwt';
import type { UserRole } from '../../src/types/index';

type TestUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
};

export const createTestUser = async ({
  name = 'Test Student',
  email = 'student@example.com',
  password = 'Password123!',
  role = 'Student',
}: TestUserInput = {}): Promise<IUser> => {
  return User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role,
  });
};

export const authHeaderFor = (user: IUser): { Authorization: string } => ({
  Authorization: `Bearer ${generateToken(String(user._id))}`,
});

export const createAuthedUser = async (input: TestUserInput = {}) => {
  const user = await createTestUser(input);
  return { user, headers: authHeaderFor(user) };
};
