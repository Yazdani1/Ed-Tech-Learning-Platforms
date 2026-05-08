import { Router } from 'express';
import {
	createNotification,
	deleteNotification,
	getMyNotifications,
	getSentNotifications,
	getUnreadNotificationCount,
	markAllNotificationsRead,
	markNotificationRead,
	updateNotification,
} from '../controllers/notification.controller';
import { authorize, protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadNotificationCount);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

router.post('/', authorize('Super Admin', 'Admin'), createNotification);
router.get('/sent/all', authorize('Super Admin', 'Admin'), getSentNotifications);
router.put('/:id', authorize('Super Admin', 'Admin'), updateNotification);
router.delete('/:id', authorize('Super Admin', 'Admin'), deleteNotification);

export default router;
