import { Router } from 'express';
import { exportRevenueOrders, getRevenueOrders, getRevenueSummary } from '../controllers/revenue.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const managers = authorize('Super Admin', 'Admin');

router.get('/summary', protect, managers, getRevenueSummary);
router.get('/orders/export', protect, managers, exportRevenueOrders);
router.get('/orders', protect, managers, getRevenueOrders);

export default router;
