import { Router } from 'express';
import {
	getPublicSiteSettings,
	getVatSetting,
	updateCompanyContact,
	updateHiddenPages,
	updateVatSetting,
} from '../controllers/siteSetting.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/public', getPublicSiteSettings);
router.put('/pages', protect, authorize('Super Admin'), updateHiddenPages);
router.get('/vat', protect, authorize('Super Admin'), getVatSetting);
router.put('/vat', protect, authorize('Super Admin'), updateVatSetting);
router.put('/contact', protect, authorize('Super Admin', 'Admin'), updateCompanyContact);

export default router;
