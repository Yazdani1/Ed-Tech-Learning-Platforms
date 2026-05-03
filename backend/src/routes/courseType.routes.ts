import { Router } from 'express';
import {
  getCourseTypes,
  createCourseType,
  updateCourseType,
  deleteCourseType,
} from '../controllers/courseType.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getCourseTypes);
router.post('/', protect, authorize('Super Admin', 'Admin'), createCourseType);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), updateCourseType);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), deleteCourseType);

export default router;
