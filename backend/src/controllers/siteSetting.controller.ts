import type { Request, Response } from 'express';
import { SiteSetting, SITE_PAGE_KEYS, type ICompanyContact, type SitePageKey } from '../models/SiteSetting.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const SETTINGS_KEY = 'site';
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{5,19}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const ADDRESS_MAX = 300;

const publicView = (setting: { hiddenPages?: SitePageKey[]; contact?: ICompanyContact } | null) => ({
	hiddenPages: setting?.hiddenPages ?? [],
	contact: {
		phone: setting?.contact?.phone ?? '',
		whatsapp: setting?.contact?.whatsapp ?? '',
		email: setting?.contact?.email ?? '',
		address: setting?.contact?.address ?? '',
	},
});

/** Optional contact text: '' clears it; anything else must pass the check. */
const contactText = (value: unknown, label: string, valid: (text: string) => boolean): string | undefined => {
	if (value === undefined) return undefined;
	if (typeof value !== 'string') throw new AppError(`${label} must be text`, 400);
	const text = value.trim();
	if (text && !valid(text)) throw new AppError(`${label} is not valid`, 400);
	return text;
};

const isPhone = (text: string) => PHONE_PATTERN.test(text);

// GET /api/site-settings/public — hidden pages and company contact (everyone)
export const getPublicSiteSettings = asyncHandler(async (_req: Request, res: Response) => {
	const setting = await SiteSetting.findOne({ key: SETTINGS_KEY }).lean();
	res.status(200).json({ success: true, data: publicView(setting) });
});

// PUT /api/site-settings/pages — { hiddenPages: string[] } (Super Admin)
export const updateHiddenPages = asyncHandler(async (req: Request, res: Response) => {
	const { hiddenPages } = req.body as { hiddenPages?: unknown };
	if (!Array.isArray(hiddenPages)) throw new AppError('hiddenPages must be a list', 400);
	const pages = [...new Set(hiddenPages)];
	if (!pages.every((page): page is SitePageKey => SITE_PAGE_KEYS.includes(page as SitePageKey)))
		throw new AppError('Unknown page in hiddenPages', 400);

	const setting = await SiteSetting.findOneAndUpdate(
		{ key: SETTINGS_KEY },
		{ $set: { hiddenPages: pages, updatedBy: req.user._id } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).lean();
	res.status(200).json({ success: true, message: 'Page visibility updated', data: publicView(setting) });
});

// PUT /api/site-settings/contact — { phone?, whatsapp?, email?, address? } (Super Admin, Admin)
export const updateCompanyContact = asyncHandler(async (req: Request, res: Response) => {
	const body = req.body as Record<string, unknown>;
	const fields: Array<[keyof ICompanyContact, string | undefined]> = [
		['phone', contactText(body.phone, 'Phone number', isPhone)],
		['whatsapp', contactText(body.whatsapp, 'WhatsApp number', isPhone)],
		['email', contactText(body.email, 'Email', (text) => text.length <= EMAIL_MAX && EMAIL_PATTERN.test(text))],
		['address', contactText(body.address, 'Address', (text) => text.length <= ADDRESS_MAX)],
	];
	const updates: Record<string, string> = {};
	for (const [field, value] of fields) if (value !== undefined) updates[`contact.${field}`] = value;
	if (Object.keys(updates).length === 0) throw new AppError('Nothing to update', 400);

	const setting = await SiteSetting.findOneAndUpdate(
		{ key: SETTINGS_KEY },
		{ $set: { ...updates, updatedBy: req.user._id } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).lean();
	res.status(200).json({ success: true, message: 'Company contact updated', data: publicView(setting) });
});
