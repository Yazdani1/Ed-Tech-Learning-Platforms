import { Router } from 'express';
import {
  enroll,
  getMyEnrollments,
  checkEnrollment,
  getCourseEnrollments,
  getCourseEnrolledStudents,
  exportCourseEnrolledStudents,
  getCourseEnrollmentStats,
  getCourseEnrollmentCount,
  getMyPurchases,
} from '../controllers/enrollment.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { paymentLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const adminOnly = authorize('Super Admin', 'Admin');
const staffOnly = authorize('Super Admin', 'Admin', 'Moderator', 'Teacher');
const exportRoles = authorize('Super Admin', 'Admin', 'Moderator');

// Admin routes — course-specific
router.get('/admin/course/:courseId', protect, adminOnly, getCourseEnrollments);
router.get('/admin/course/:courseId/stats', protect, adminOnly, getCourseEnrollmentStats);
router.get('/course/:courseId/students', protect, staffOnly, getCourseEnrolledStudents);
router.get('/course/:courseId/students/export', protect, exportRoles, exportCourseEnrolledStudents);

// Any authenticated user — public enrollment count for a course
router.get('/course/:courseId/count', protect, getCourseEnrollmentCount);

// Student routes
router.get('/', protect, authorize('Student'), getMyEnrollments);
router.get('/me/purchases', protect, authorize('Student'), getMyPurchases);
router.get('/:courseId/check', protect, authorize('Student'), checkEnrollment);
router.post('/:courseId', protect, authorize('Student'), paymentLimiter, enroll);
// No DELETE: an enrolment is never removed by the student (user's decision 2026-11-06)

export default router;
