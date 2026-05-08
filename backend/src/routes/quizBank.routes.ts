import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createQuizBank,
  getCourseQuizBanks,
  getContextQuizBanks,
  getQuizBank,
  updateQuizBank,
  deleteQuizBank,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getMyAttempt,
  submitAnswer,
  resetAttempt,
} from '../controllers/quizBank.controller';

const router = Router();

router.get('/course/:courseId', protect, getCourseQuizBanks);
router.get('/context/:contextType/:contextId', protect, getContextQuizBanks);
router.post('/', protect, createQuizBank);
router.get('/:id', protect, getQuizBank);
router.put('/:id', protect, updateQuizBank);
router.delete('/:id', protect, deleteQuizBank);

router.post('/:id/questions', protect, addQuestion);
router.put('/:id/questions/:qId', protect, updateQuestion);
router.delete('/:id/questions/:qId', protect, deleteQuestion);

router.get('/:id/attempt', protect, getMyAttempt);
router.post('/:id/attempt/answer', protect, submitAnswer);
router.delete('/:id/attempt', protect, resetAttempt);

export default router;
