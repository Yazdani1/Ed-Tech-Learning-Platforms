import { Router } from 'express';
import { getPublicSiteSettings, updateCompanyContact, updateHiddenPages } from '../controllers/siteSetting.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/public', getPublicSiteSettings);
router.put('/pages', protect, authorize('Super Admin'), updateHiddenPages);
router.put('/contact', protect, authorize('Super Admin', 'Admin'), updateCompanyContact);

export default router;
