import { Router } from 'express';
import {
  getCourseAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcement.controller';
import {
  archiveBroadcast,
  createBroadcast,
  getBroadcastById,
  getBroadcastHistory,
  getBroadcasts,
  updateBroadcast,
} from '../controllers/announcementBroadcast.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Announcements page: one announcement sent to several courses (staff of the admin area)
const broadcastRoles = authorize('Super Admin', 'Admin', 'Moderator');
router.get('/broadcasts', protect, broadcastRoles, getBroadcasts);
router.post('/broadcasts', protect, broadcastRoles, upload.single('image'), createBroadcast);
router.get('/broadcasts/:id/history', protect, broadcastRoles, getBroadcastHistory);
router.get('/broadcasts/:id', protect, broadcastRoles, getBroadcastById);
router.put('/broadcasts/:id', protect, broadcastRoles, upload.single('image'), updateBroadcast);
router.delete('/broadcasts/:id', protect, broadcastRoles, archiveBroadcast);
router.get('/course/:courseId', protect, getCourseAnnouncements);
router.post('/course/:courseId', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), createAnnouncement);
router.put('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), updateAnnouncement);
router.delete('/:id', protect, authorize('Teacher', 'Admin', 'Super Admin', 'Moderator'), deleteAnnouncement);

export default router;
