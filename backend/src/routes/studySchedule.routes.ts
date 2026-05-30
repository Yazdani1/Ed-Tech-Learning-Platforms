import { Router } from 'express';
import {
	getMySchedules,
	createTimer,
	createReminder,
	updateSchedule,
	deleteSchedule,
} from '../controllers/studySchedule.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getMySchedules);
router.post('/timer', protect, createTimer);
router.post('/reminder', protect, createReminder);
router.put('/:id', protect, updateSchedule);
router.delete('/:id', protect, deleteSchedule);

export default router;
