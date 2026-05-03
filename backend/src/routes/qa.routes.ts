import { Router } from 'express';
import {
  getCourseQuestions,
  getQuestionWithAnswers,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  upvoteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  upvoteAnswer,
} from '../controllers/qa.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Questions
router.get('/questions/course/:courseId', protect, getCourseQuestions);
router.get('/questions/:id', protect, getQuestionWithAnswers);
router.post('/questions/course/:courseId', protect, createQuestion);
router.put('/questions/:id', protect, updateQuestion);
router.delete('/questions/:id', protect, deleteQuestion);
router.patch('/questions/:id/upvote', protect, upvoteQuestion);

// Answers
router.post('/answers/question/:questionId', protect, createAnswer);
router.put('/answers/:id', protect, updateAnswer);
router.delete('/answers/:id', protect, deleteAnswer);
router.patch('/answers/:id/upvote', protect, upvoteAnswer);

export default router;
