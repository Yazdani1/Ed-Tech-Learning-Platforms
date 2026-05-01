import { Router } from 'express';
import {
	enroll,
	getMyEnrollments,
	checkEnrollment,
} from '../controllers/enrollment.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, authorize('Student'), getMyEnrollments);
router.get('/:courseId/check', protect, authorize('Student'), checkEnrollment);
router.post('/:courseId', protect, authorize('Student'), enroll);

export default router;
