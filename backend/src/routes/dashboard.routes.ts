import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, authorize('Super Admin', 'Admin', 'Moderator'));

router.get('/summary', getDashboardSummary);

export default router;
