import { Router } from 'express';
import {
	createPromo,
	deletePromo,
	getActivePromoCourses,
	getActivePromos,
	getPromos,
	updatePromo,
} from '../controllers/promo.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();
const adminRoles = ['Super Admin', 'Admin'] as const;

// Public: home banner, pop-up and the promo courses page
router.get('/active', getActivePromos);
router.get('/active/courses', getActivePromoCourses);
router.get('/', protect, authorize(...adminRoles), getPromos);
router.post('/', protect, authorize(...adminRoles), createPromo);
router.patch('/:id', protect, authorize(...adminRoles), updatePromo);
router.delete('/:id', protect, authorize(...adminRoles), deletePromo);

export default router;
