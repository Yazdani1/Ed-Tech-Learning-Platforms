import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, updateUserRole, deleteUser } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, authorize('Super Admin', 'Admin'), createUser);
router.get('/', protect, authorize('Super Admin', 'Admin'), getUsers);
router.get('/:id', protect, authorize('Super Admin', 'Admin'), getUserById);
router.put('/:id', protect, authorize('Super Admin', 'Admin'), updateUser);
router.put('/:id/role', protect, authorize('Super Admin', 'Admin'), updateUserRole);
router.delete('/:id', protect, authorize('Super Admin'), deleteUser);

export default router;
