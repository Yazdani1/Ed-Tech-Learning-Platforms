import { Router } from 'express';
import {
	createPromo,
	deletePromo,
	getActivePromoCourses,
	getActivePromos,
	getPromoDesign,
	updatePromoDesign,
	deletePromoDesign,
	getPromoHistory,
	getPromos,
	updatePromo,
} from '../controllers/promo.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
const adminRoles = ['Super Admin', 'Admin'] as const;

// Public: home banner, pop-up and the promo courses page
router.get('/active', getActivePromos);
router.get('/active/courses', getActivePromoCourses);
router.get('/design', getPromoDesign);
router.put('/design/:slot', protect, authorize(...adminRoles), upload.single('image'), updatePromoDesign);
router.delete('/design/:slot', protect, authorize(...adminRoles), deletePromoDesign);
router.get('/', protect, authorize(...adminRoles), getPromos);
router.get('/:id/history', protect, authorize(...adminRoles), getPromoHistory);
router.post('/', protect, authorize(...adminRoles), createPromo);
router.patch('/:id', protect, authorize(...adminRoles), updatePromo);
router.delete('/:id', protect, authorize(...adminRoles), deletePromo);

export default router;
