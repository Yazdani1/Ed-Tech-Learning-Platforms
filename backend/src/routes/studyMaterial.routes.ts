import { Router } from 'express';
import {
  getCourseStudyMaterials,
  createStudyMaterial,
  updateStudyMaterial,
  deleteStudyMaterial,
} from '../controllers/studyMaterial.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', protect, getCourseStudyMaterials);
router.post('/course/:courseId', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), createStudyMaterial);
router.put('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), updateStudyMaterial);
router.delete('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), deleteStudyMaterial);

export default router;
