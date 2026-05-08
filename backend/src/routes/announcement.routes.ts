import { Router } from 'express';
import {
  getCourseAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/course/:courseId', protect, getCourseAnnouncements);
router.post('/course/:courseId', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), createAnnouncement);
router.put('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), updateAnnouncement);
router.delete('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), deleteAnnouncement);

export default router;
