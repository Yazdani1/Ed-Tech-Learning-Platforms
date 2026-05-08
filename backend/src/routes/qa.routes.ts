import { Router } from 'express';
import {
  getCourseQuestions,
  getAllCourseQuestions,
  getQuestionWithAnswers,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  resolveQuestion,
  upvoteQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  upvoteAnswer,
} from '../controllers/qa.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Questions
router.get(
  '/admin/course-questions',
  protect,
  authorize('Super Admin', 'Admin', 'Moderator'),
  getAllCourseQuestions,
);
router.get('/questions/course/:courseId', protect, getCourseQuestions);
router.post('/questions/course/:courseId', protect, createQuestion);
router.patch('/questions/:id/resolve', protect, resolveQuestion);
router.patch('/questions/:id/upvote', protect, upvoteQuestion);
router.get('/questions/:id', protect, getQuestionWithAnswers);
router.put('/questions/:id', protect, updateQuestion);
router.delete('/questions/:id', protect, deleteQuestion);

// Answers
router.post('/answers/question/:questionId', protect, createAnswer);
router.put('/answers/:id', protect, updateAnswer);
router.delete('/answers/:id', protect, deleteAnswer);
router.patch('/answers/:id/upvote', protect, upvoteAnswer);

export default router;
