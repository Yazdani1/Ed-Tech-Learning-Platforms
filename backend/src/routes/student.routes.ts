import { Router } from 'express';
import { exportStudents, getStudents, getStudentCourses, getStudentDetails } from '../controllers/student.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, authorize('Super Admin', 'Admin'));

router.get('/', getStudents);
router.get('/export', authorize('Super Admin'), exportStudents);
router.get('/courses', getStudentCourses);
router.get('/:id', getStudentDetails);

export default router;
