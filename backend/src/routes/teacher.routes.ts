import { Router } from 'express';
import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacher.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getTeachers);
router.get('/:id', getTeacherById);

router.post('/', protect, authorize('Super Admin', 'Admin'), upload.single('profileImage'), createTeacher);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), upload.single('profileImage'), updateTeacher);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), deleteTeacher);

export default router;
