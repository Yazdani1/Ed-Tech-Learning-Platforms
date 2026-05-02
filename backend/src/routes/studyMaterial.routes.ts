import { Router } from 'express';
import {
  getCourseStudyMaterials,
  createStudyMaterial,
  deleteStudyMaterial,
} from '../controllers/studyMaterial.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', protect, getCourseStudyMaterials);
router.post('/course/:courseId', protect, authorize('Teacher', 'Admin', 'Super Admin'), createStudyMaterial);
router.delete('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin'), deleteStudyMaterial);

export default router;
