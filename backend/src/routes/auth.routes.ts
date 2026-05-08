import { Router } from 'express';
import { register, login, logout, getMe, updateMe } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('avatar'), updateMe);

export default router;
