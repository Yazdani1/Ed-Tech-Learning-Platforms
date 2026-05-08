import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getConversations, getMessages } from '../controllers/chat.controller';

const router = Router();

router.use(protect);
router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getMessages);

export default router;
