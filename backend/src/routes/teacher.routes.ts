import { Router } from 'express';
import {
  getTeachers,
  getTeacherById,
  getMyTeacherCourses,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacher.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getTeachers);
router.get('/my-courses', protect, authorize('Teacher'), getMyTeacherCourses);
router.get('/:id', getTeacherById);

router.post('/', protect, authorize('Super Admin', 'Admin'), upload.single('profileImage'), createTeacher);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), upload.single('profileImage'), updateTeacher);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), deleteTeacher);

export default router;
