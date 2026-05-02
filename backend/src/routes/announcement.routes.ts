import { Router } from 'express';
import {
  getCourseAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', protect, getCourseAnnouncements);
router.post('/course/:courseId', protect, authorize('Teacher', 'Admin', 'Super Admin'), createAnnouncement);
router.delete('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin'), deleteAnnouncement);

export default router;
