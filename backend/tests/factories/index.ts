// Test data factories shared by the integration tests. Each call creates unique documents, so tests in
// one file can run without clashing. Documents are created straight through the backend's own models.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { Category } from '../../src/models/Category.model';
import { Course, type ICourse } from '../../src/models/Course.model';
import { CourseType } from '../../src/models/CourseType.model';
import { Enrollment } from '../../src/models/Enrollment.model';
import { Teacher, type ITeacher } from '../../src/models/Teacher.model';
import { User, type IUser } from '../../src/models/User.model';
import { generateToken } from '../../src/utils/jwt';

import type { UserRole } from '../../src/types/index';

export const ROLES: readonly UserRole[] = [
  'Super Admin',
  'Admin',
  'Moderator',
  'Teacher',
  'Student',
];
export const STAFF_ROLES: readonly UserRole[] = ['Super Admin', 'Admin', 'Moderator'];

/** Password of every factory user (login tests use it). */
export const TEST_PASSWORD = 'Test-password-1';
// Low cost keeps the tests fast; the login code compares with bcrypt whatever the cost was.
const TEST_BCRYPT_ROUNDS = 4;
const passwordHash = bcrypt.hashSync(TEST_PASSWORD, TEST_BCRYPT_ROUNDS);

let sequence = 0;
/** A number unique within the test run (names, emails, slugs). */
export const nextId = (): number => {
  sequence += 1;
  return sequence;
};

/** A valid ObjectId that belongs to no document (404 tests). */
export const missingId = (): string => new mongoose.Types.ObjectId().toString();

export const createUser = async (
  role: UserRole = 'Student',
  overrides: Partial<IUser> = {},
): Promise<IUser> => {
  const n = nextId();
  return User.create({
    name: `${role} ${n}`,
    email: `user${n}@example.com`,
    password: passwordHash,
    role,
    ...overrides,
  });
};

/** One user per role, keyed by role. */
export const createUsersForAllRoles = async (): Promise<Record<UserRole, IUser>> => {
  const users = await Promise.all(ROLES.map((role) => createUser(role)));
  return Object.fromEntries(ROLES.map((role, i) => [role, users[i]])) as Record<UserRole, IUser>;
};

/** The `token` cookie the Next.js app sends (signed with the backend's own JWT helper). */
export const authCookie = (user: IUser): string => `token=${generateToken(String(user._id))}`;

/** The Bearer header the old client sends. */
export const bearer = (user: IUser): string => `Bearer ${generateToken(String(user._id))}`;

export const createCategory = async (overrides: Record<string, unknown> = {}) => {
  const n = nextId();
  return Category.create({ name: `Category ${n}`, slug: `category-${n}`, ...overrides });
};

export const createCourseType = async (overrides: Record<string, unknown> = {}) => {
  const n = nextId();
  return CourseType.create({ name: `Course type ${n}`, slug: `course-type-${n}`, ...overrides });
};

/** A teacher profile, linked to a Teacher-role user when one is given. */
export const createTeacherProfile = async (
  user?: IUser,
  overrides: Partial<ITeacher> = {},
): Promise<ITeacher> => {
  const n = nextId();
  return Teacher.create({
    name: user?.name ?? `Teacher ${n}`,
    bio: `Bio ${n}`,
    ...(user ? { userId: user._id } : {}),
    ...overrides,
  });
};

/** A published, public, free course (category, course type and creator made when not given). */
export const createCourse = async (overrides: Partial<ICourse> = {}): Promise<ICourse> => {
  const n = nextId();
  const category = overrides.category ?? (await createCategory())._id;
  const courseType = overrides.courseType ?? (await createCourseType())._id;
  const createdBy = overrides.createdBy ?? (await createUser('Admin'))._id;
  return Course.create({
    title: `Course ${n}`,
    description: `Description ${n}`,
    status: 'Published',
    visibility: 'Public',
    pricing: 'Free',
    ...overrides,
    category,
    courseType,
    createdBy,
  });
};

export const enrol = async (student: IUser, course: ICourse) =>
  Enrollment.create({ student: student._id, course: course._id });

/** A tiny valid PNG (magic bytes + header) for upload tests. */
export const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
