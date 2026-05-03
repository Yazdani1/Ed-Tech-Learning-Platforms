import { Router } from 'express';
import {
  enroll,
  unenroll,
  getMyEnrollments,
  checkEnrollment,
  getCourseEnrollments,
  getCourseEnrollmentStats,
  getCourseEnrollmentCount,
} from '../controllers/enrollment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

const adminOnly = authorize('Super Admin', 'Admin');

// Admin routes — course-specific
router.get('/admin/course/:courseId', protect, adminOnly, getCourseEnrollments);
router.get('/admin/course/:courseId/stats', protect, adminOnly, getCourseEnrollmentStats);

// Any authenticated user — public enrollment count for a course
router.get('/course/:courseId/count', protect, getCourseEnrollmentCount);

// Student routes
router.get('/', protect, authorize('Student'), getMyEnrollments);
router.get('/:courseId/check', protect, authorize('Student'), checkEnrollment);
router.post('/:courseId', protect, authorize('Student'), enroll);
router.delete('/:courseId', protect, authorize('Student'), unenroll);

export default router;
