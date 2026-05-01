import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCategories);
router.post('/', protect, authorize('Super Admin', 'Admin'), createCategory);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), updateCategory);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), deleteCategory);

export default router;
