import { Router } from 'express';
import {
  getAllPlanConfigs,
  upsertPlanConfig,
  deletePlanConfig,
} from '../controllers/subscriptionPlanConfig.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getAllPlanConfigs);

router.use(protect);
router.post('/', authorize('Super Admin', 'Admin'), upsertPlanConfig);
router.delete('/:id', authorize('Super Admin', 'Admin'), deletePlanConfig);

export default router;
