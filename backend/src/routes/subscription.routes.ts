import { Router } from 'express';
import {
  getAllSubscriptions,
  getMySubscription,
  assignSubscription,
  cancelSubscription,
} from '../controllers/subscription.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/my', getMySubscription);
router.get('/', authorize('Super Admin', 'Admin'), getAllSubscriptions);
router.post('/assign', authorize('Super Admin', 'Admin'), assignSubscription);
router.patch('/:id/cancel', authorize('Super Admin', 'Admin'), cancelSubscription);

export default router;
