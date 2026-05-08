import { Router } from 'express';
import { getPerformanceOverview, getPerformanceCourses } from '../controllers/performance.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, authorize('Super Admin'));

router.get('/overview', getPerformanceOverview);
router.get('/courses', getPerformanceCourses);

export default router;
