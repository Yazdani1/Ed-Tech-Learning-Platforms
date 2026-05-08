import { Router } from 'express';
import {
	createStudyCurriculum,
	deleteStudyCurriculum,
	getCourseStudyCurricula,
	updateStudyCurriculum,
} from '../controllers/studyCurriculum.controller';
import { authorize, protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', getCourseStudyCurricula);
router.post('/course/:courseId', protect, authorize('Teacher', 'Admin', 'Super Admin'), createStudyCurriculum);
router.put('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), updateStudyCurriculum);
router.delete('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), deleteStudyCurriculum);

export default router;
