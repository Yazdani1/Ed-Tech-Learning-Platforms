import { Router } from 'express';
import { getUsers, getUserById, updateUserRole, deleteUser } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(protect, authorize('Super Admin', 'Admin'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
