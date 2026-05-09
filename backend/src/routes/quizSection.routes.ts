import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getCourseQuizSections,
  createQuizSection,
  updateQuizSection,
  deleteQuizSection,
} from '../controllers/quizSection.controller';

const router = Router();

router.get('/course/:courseId', protect, getCourseQuizSections);
router.post('/', protect, createQuizSection);
router.put('/:id', protect, updateQuizSection);
router.delete('/:id', protect, deleteQuizSection);

export default router;
