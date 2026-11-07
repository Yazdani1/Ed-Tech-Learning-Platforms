import { Router } from 'express';
import { register, login, logout, getMe, updateMe, recordActivity } from '../controllers/auth.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { accountLimiter, activityLimiter, loginLimiter, registerLimiter } from '../middleware/rateLimit.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/me/activity', protect, authorize('Student'), activityLimiter, recordActivity);
router.put('/me', protect, accountLimiter, upload.single('avatar'), updateMe);

export default router;
