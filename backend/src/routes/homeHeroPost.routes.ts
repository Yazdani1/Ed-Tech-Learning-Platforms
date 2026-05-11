import { Router } from 'express';
import {
	createHomeHeroPosts,
	deleteHomeHeroPost,
	getAdminHomeHeroPosts,
	getAdminSiteLogo,
	getPublicHomeHeroPosts,
	getPublicSiteLogo,
	reorderHomeHeroPosts,
	updateSiteLogo,
	updateHomeHeroPost,
} from '../controllers/homeHeroPost.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/public', getPublicHomeHeroPosts);
router.get('/logo/public', getPublicSiteLogo);

router.use(protect, authorize('Super Admin', 'Admin'));
router.get('/logo', getAdminSiteLogo);
router.put('/logo', upload.single('logo'), updateSiteLogo);
router.get('/', getAdminHomeHeroPosts);
router.post('/', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 10 }]), createHomeHeroPosts);
router.patch('/reorder', reorderHomeHeroPosts);
router.put('/:id', upload.single('image'), updateHomeHeroPost);
router.delete('/:id', deleteHomeHeroPost);

export default router;
