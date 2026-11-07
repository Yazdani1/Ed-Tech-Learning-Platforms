import { Router } from 'express';
import {
	checkCoupon,
	createCoupon,
	deleteCoupon,
	getCourseCoupons,
	suggestCouponCode,
	updateCoupon,
} from '../controllers/coupon.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { couponCheckLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const adminRoles = ['Super Admin', 'Admin'] as const;

// Public: course and payment pages check a typed code
router.get('/check', couponCheckLimiter, checkCoupon);
router.get('/suggest', protect, authorize(...adminRoles), suggestCouponCode);
router.get('/', protect, authorize(...adminRoles), getCourseCoupons);
router.post('/', protect, authorize(...adminRoles), createCoupon);
router.patch('/:id', protect, authorize(...adminRoles), updateCoupon);
router.delete('/:id', protect, authorize(...adminRoles), deleteCoupon);

export default router;
