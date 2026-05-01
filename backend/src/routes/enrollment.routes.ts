import { Router } from 'express';
import { enroll, getMyEnrollments, checkEnrollment } from '../controllers/enrollment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// All enrollment routes require an authenticated Student
router.use(protect, authorize('Student'));

router.post('/:courseId', enroll);
router.get('/', getMyEnrollments);
router.get('/:courseId/check', checkEnrollment);

export default router;
