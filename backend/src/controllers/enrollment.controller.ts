import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import type { EnrollmentType } from '../models/Enrollment.model';

export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const studentId = String(req.user._id);

  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (course.status !== 'Published')
    throw new AppError('This course is not available for enrollment', 400);

  const existing = await Enrollment.findOne({ student: studentId, course: courseId });
  if (existing) throw new AppError('Already enrolled in this course', 400);

  // Auto-detect enrollment type
  let enrollmentType: EnrollmentType = 'free';
  if (course.pricing === 'Paid') {
    const student = await User.findById(studentId).select('activeSubscription');
    const sub = student?.activeSubscription;
    if (
      sub &&
      course.includedInSubscription &&
      course.allowedSubscriptionPlans.includes(sub.plan) &&
      new Date(sub.endDate) > new Date()
    ) {
      enrollmentType = 'subscription';
    } else {
      enrollmentType = 'paid';
    }
  }

  await Enrollment.create({
    student: new Types.ObjectId(studentId),
    course: new Types.ObjectId(courseId),
    enrollmentType,
  });

  res.status(201).json({ success: true, message: 'Enrolled successfully' });
});

export const unenroll = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const studentId = String(req.user._id);

  const enrollment = await Enrollment.findOneAndDelete({
    student: studentId,
    course: courseId,
  });
  if (!enrollment) throw new AppError('Enrollment not found', 404);

  res.status(200).json({ success: true, message: 'Unenrolled successfully' });
});

export const getMyEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const enrollments = await Enrollment.find({ student: String(req.user._id) })
    .populate({
      path: 'course',
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'teachers', select: 'name profileImage' },
      ],
    })
    .sort({ createdAt: -1 });

  const courses = enrollments
    .filter((e) => Boolean(e.course))
    .map((e) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(e.course as any).toObject(),
      enrollmentType: e.enrollmentType,
    }));

  res.status(200).json({ success: true, data: courses, total: courses.length });
});

export const checkEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await Enrollment.findOne({
    student: String(req.user._id),
    course: String(req.params.courseId),
  });

  res.status(200).json({ success: true, data: { isEnrolled: !!enrollment } });
});

export const getCourseEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const { type } = req.query;

  const filter: Record<string, unknown> = { course: courseId };
  if (type && ['free', 'paid', 'subscription'].includes(String(type))) {
    filter.enrollmentType = type;
  }

  const enrollments = await Enrollment.find(filter)
    .populate('student', 'name email avatar')
    .populate('course', 'title price pricing')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: enrollments, total: enrollments.length });
});

export const getCourseEnrollmentCount = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const count = await Enrollment.countDocuments({ course: courseId });
  res.status(200).json({ success: true, data: { count } });
});

export const getCourseEnrollmentStats = asyncHandler(async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, free, paid, subscription, thisMonth] = await Promise.all([
    Enrollment.countDocuments({ course: courseId }),
    Enrollment.countDocuments({ course: courseId, enrollmentType: 'free' }),
    Enrollment.countDocuments({ course: courseId, enrollmentType: 'paid' }),
    Enrollment.countDocuments({ course: courseId, enrollmentType: 'subscription' }),
    Enrollment.find({ course: courseId, createdAt: { $gte: startOfMonth } })
      .populate('course', 'price pricing'),
  ]);

  const thisMonthCount = thisMonth.length;
  const thisMonthEarned = thisMonth.reduce((sum, e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const course = e.course as any;
    if (e.enrollmentType === 'paid' && course?.price) {
      return sum + course.price;
    }
    return sum;
  }, 0);

  res.status(200).json({
    success: true,
    data: { total, free, paid, subscription, thisMonthCount, thisMonthEarned },
  });
});
