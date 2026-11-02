import { Router } from 'express';
import { createTool, deleteTool, getTools, updateTool } from '../controllers/tool.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', getTools);
router.post('/', protect, authorize('Super Admin', 'Admin'), upload.single('logo'), createTool);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), upload.single('logo'), updateTool);
router.delete('/:id', protect, authorize('Super Admin', 'Admin'), deleteTool);

export default router;
