import { Types } from 'mongoose';
import { Course, type ICourse } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Teacher } from '../models/Teacher.model';
import type { IUser } from '../models/User.model';
import { AppError } from './AppError';

const STAFF_ROLES = ['Super Admin', 'Admin', 'Moderator'];

export const isStaff = (user: IUser): boolean => STAFF_ROLES.includes(user.role);

/** True when the user's teacher profile is one of the course's teachers. */
export const isCourseTeacher = async (user: IUser, course: Pick<ICourse, 'teachers'>): Promise<boolean> => {
  if (user.role !== 'Teacher') return false;
  const profile = await Teacher.findOne({ userId: user._id }).select('_id').lean();
  return Boolean(profile && course.teachers.some((id) => String(id) === String(profile._id)));
};

/**
 * A subscription enrolment only counts while the student's plan is active (endDate in the future) and the
 * course is still included in that plan (includedInSubscription, and the plan is allowed when a list is set).
 */
const subscriptionCoversCourse = async (user: IUser, courseId: ICourse['_id']): Promise<boolean> => {
  const sub = user.activeSubscription;
  if (!sub?.plan || !sub.endDate || new Date(sub.endDate).getTime() <= Date.now()) return false;
  const course = await Course.findById(courseId).select('includedInSubscription allowedSubscriptionPlans').lean();
  if (!course?.includedInSubscription) return false;
  const plans = course.allowedSubscriptionPlans ?? [];
  return plans.length === 0 || plans.includes(sub.plan);
};

/** True for staff, the course's teachers and enrolled students (subscription enrolments: active plan only). */
export const canAccessCourseContent = async (user: IUser, course: Pick<ICourse, '_id' | 'teachers'>): Promise<boolean> => {
  if (isStaff(user)) return true;
  if (user.role === 'Teacher') return isCourseTeacher(user, course);
  if (user.role !== 'Student') return false;
  const enrollment = await Enrollment.findOne({ student: user._id, course: course._id }).select('enrollmentType').lean();
  if (!enrollment) return false;
  if (enrollment.enrollmentType !== 'subscription') return true;
  return subscriptionCoversCourse(user, course._id);
};

/**
 * Course content (lectures, materials, live classes, quizzes, announcements, Q&A) is only for staff, the
 * course's teachers and enrolled students. 400 malformed id, 404 unknown course, 403 no access.
 */
export const assertCourseContentAccess = async (user: IUser, courseId: unknown): Promise<ICourse> => {
  if (typeof courseId !== 'string' || !Types.ObjectId.isValid(courseId)) throw new AppError('Invalid course id', 400);
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (!(await canAccessCourseContent(user, course))) {
    throw new AppError('You do not have access to this course', 403);
  }
  return course;
};
