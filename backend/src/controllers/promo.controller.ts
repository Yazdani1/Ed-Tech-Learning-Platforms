import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course } from '../models/Course.model';
import { Enrollment } from '../models/Enrollment.model';
import { Promo, type IPromo } from '../models/Promo.model';
import { SiteSetting } from '../models/SiteSetting.model';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { auditHistory, recordAudit } from '../utils/audit';
import { assertCodeFree, normalizeCode, parseDiscount } from '../utils/couponCode';
import { attachOffers, courseListPrice, loadRunningPromos } from '../utils/courseOffer';

const TITLE_MAX = 120;
const MAX_COURSES = 500;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const PROMO_COURSE_FIELDS = 'title subtitle coverImage pricing price listPrice discountPrice discountCode discountStartsAt discountEndsAt startDate batchNumber category courseType status visibility';

const assertId = (value: unknown): string => {
	if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) throw new AppError('Invalid promo id', 400);
	return value;
};

const parseRequiredDate = (value: unknown, label: string): Date => {
	const date = typeof value === 'string' ? new Date(value) : null;
	if (!date || Number.isNaN(date.getTime())) throw new AppError(`A valid ${label} is required`, 400);
	return date;
};

/** The promo's courses: published paid courses only, at least one (400 otherwise). */
const parseCourseIds = async (value: unknown): Promise<Types.ObjectId[]> => {
	if (!Array.isArray(value) || value.length === 0) throw new AppError('Select at least one course', 400);
	if (value.length > MAX_COURSES) throw new AppError(`A promo can include at most ${MAX_COURSES} courses`, 400);
	if (value.some((id) => typeof id !== 'string' || !Types.ObjectId.isValid(id))) throw new AppError('Invalid course id', 400);
	const ids = [...new Set(value as string[])].map((id) => new Types.ObjectId(id));
	const courses = await Course.find({ _id: { $in: ids } }).select('status pricing price listPrice').lean();
	if (courses.length !== ids.length) throw new AppError('One or more courses were not found', 404);
	if (courses.some((course) => course.status !== 'Published' || course.pricing !== 'Paid'))
		throw new AppError('A promo can only include published paid courses', 400);
	return ids;
};

/** The fields of a create (all required) or update (partial) body. */
const parsePromoBody = async (body: Record<string, unknown>, current?: IPromo): Promise<Partial<IPromo>> => {
	const fields: Partial<IPromo> = {};
	if (body.title !== undefined || !current) {
		if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > TITLE_MAX)
			throw new AppError(`Title is required (at most ${TITLE_MAX} characters)`, 400);
		fields.title = body.title.trim();
	}
	if (body.code !== undefined || !current) {
		const code = normalizeCode(body.code);
		if (code !== current?.code) await assertCodeFree(code, { promoId: current?._id });
		fields.code = code;
	}
	if (body.discountType !== undefined || body.value !== undefined || !current)
		Object.assign(fields, parseDiscount(body.discountType ?? current?.discountType, body.value ?? current?.value));
	if (body.startsAt !== undefined || !current) fields.startsAt = parseRequiredDate(body.startsAt, 'start date');
	if (body.endsAt !== undefined || !current) fields.endsAt = parseRequiredDate(body.endsAt, 'end date');
	if (body.courseIds !== undefined || !current) fields.courses = await parseCourseIds(body.courseIds);
	if (body.isActive !== undefined) {
		if (typeof body.isActive !== 'boolean') throw new AppError('isActive must be true or false', 400);
		fields.isActive = body.isActive;
	}
	const startsAt = fields.startsAt ?? current?.startsAt;
	const endsAt = fields.endsAt ?? current?.endsAt;
	if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime())
		throw new AppError('The end date must be after the start date', 400);
	// An amount must stay below every included course's list price
	const discountType = fields.discountType ?? current?.discountType;
	const value = fields.value ?? current?.value ?? 0;
	if (discountType === 'amount') {
		const courseIds = fields.courses ?? current?.courses ?? [];
		const courses = await Course.find({ _id: { $in: courseIds } }).select('pricing price listPrice').lean();
		if (courses.some((course) => value >= courseListPrice(course)))
			throw new AppError('The discount must be less than the list price of every selected course', 400);
	}
	return fields;
};

const statusOf = (promo: Pick<IPromo, 'isActive' | 'startsAt' | 'endsAt'>, now: Date): string => {
	if (!promo.isActive) return 'inactive';
	if (promo.endsAt.getTime() <= now.getTime()) return 'expired';
	if (promo.startsAt.getTime() > now.getTime()) return 'scheduled';
	return 'active';
};

/** GET /api/promos?page&limit: every promo, newest first, with its course count, status and uses. */
export const getPromos = asyncHandler(async (req: Request, res: Response) => {
	const page = Math.max(Number(req.query.page) || 1, 1);
	const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
	const [promos, total] = await Promise.all([
		Promo.find()
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.populate('courses', 'title coverImage batchNumber')
			.populate('createdBy', 'name')
			.lean(),
		Promo.countDocuments(),
	]);
	const codes = promos.map((promo) => promo.code);
	const usage = await Enrollment.aggregate<{ _id: string; count: number }>([
		{ $match: { couponCode: { $in: codes }, couponSource: 'promo' } },
		{ $group: { _id: '$couponCode', count: { $sum: 1 } } },
	]);
	const used = new Map(usage.map((row) => [row._id, row.count]));
	const now = new Date();
	const data = promos.map((promo) => ({ ...promo, usedCount: used.get(promo.code) ?? 0, status: statusOf(promo, now) }));
	res.status(200).json({ success: true, data, total, page, limit });
});

/** GET /api/promos/active (public): the running promos for the home banner and pop-up (newest first). */
export const getActivePromos = asyncHandler(async (_req: Request, res: Response) => {
	const promos = await loadRunningPromos();
	const data = promos.map((promo) => ({
		_id: promo._id,
		title: promo.title,
		code: promo.code,
		discountType: promo.discountType,
		value: promo.value,
		startsAt: promo.startsAt,
		endsAt: promo.endsAt,
		courseCount: promo.courses.length,
	}));
	res.status(200).json({ success: true, data, total: data.length });
});

/** GET /api/promos/active/courses (public): the published public courses of the running promos, with offers. */
export const getActivePromoCourses = asyncHandler(async (_req: Request, res: Response) => {
	const promos = await loadRunningPromos();
	const ids = [...new Set(promos.flatMap((promo) => promo.courses.map(String)))].map((id) => new Types.ObjectId(id));
	const courses = ids.length
		? await Course.find({ _id: { $in: ids }, status: 'Published', visibility: 'Public', pricing: 'Paid' })
				.select(PROMO_COURSE_FIELDS)
				.populate('category', 'name slug')
				.populate('courseType', 'name slug description')
				.sort({ createdAt: -1 })
				.lean()
		: [];
	const data = await attachOffers(courses);
	res.status(200).json({ success: true, data, total: data.length });
});

/** POST /api/promos: a promo for selected published paid courses. */
export const createPromo = asyncHandler(async (req: Request, res: Response) => {
	const fields = await parsePromoBody(req.body as Record<string, unknown>);
	const promo = await Promo.create({ ...fields, createdBy: req.user._id });
	res.status(201).json({ success: true, message: 'Promo created', data: promo });
});

/** PATCH /api/promos/:id: change fields or switch the promo on / off. */
export const updatePromo = asyncHandler(async (req: Request, res: Response) => {
	const promo = await Promo.findById(assertId(req.params.id));
	if (!promo) throw new AppError('Promo not found', 404);
	const wasActive = promo.isActive;
	promo.set(await parsePromoBody(req.body as Record<string, unknown>, promo));
	await promo.save();
	if (promo.isActive !== wasActive)
		await recordAudit({
			action: 'promo.toggle',
			entityType: 'Promo',
			entity: promo._id,
			actor: req.user._id,
			before: { isActive: wasActive },
			after: { isActive: promo.isActive },
		});
	res.status(200).json({ success: true, message: 'Promo updated', data: promo });
});

/** DELETE /api/promos/:id: only a promo nobody enrolled with (otherwise switch it off). */
export const deletePromo = asyncHandler(async (req: Request, res: Response) => {
	const promo = await Promo.findById(assertId(req.params.id));
	if (!promo) throw new AppError('Promo not found', 404);
	const used = await Enrollment.countDocuments({ couponCode: promo.code, couponSource: 'promo' });
	if (used > 0) throw new AppError('This promo was used by students; switch it off instead of deleting', 400);
	await promo.deleteOne();
	res.status(200).json({ success: true, message: 'Promo deleted' });
});

const DESIGN_SLOTS = { banner: 'promoBannerImage', popup: 'promoPopupImage' } as const;
type DesignSlot = keyof typeof DESIGN_SLOTS;

const designSlot = (value: unknown): DesignSlot => {
	if (value !== 'banner' && value !== 'popup') throw new AppError('Picture must be banner or popup', 400);
	return value;
};

const designView = (setting: { promoBannerImage?: { url?: string }; promoPopupImage?: { url?: string } } | null) => ({
	bannerImage: setting?.promoBannerImage?.url ?? '',
	popupImage: setting?.promoPopupImage?.url ?? '',
});

/** GET /api/promos/design (public): the custom banner and pop-up pictures of running promos ('' = default design). */
export const getPromoDesign = asyncHandler(async (_req: Request, res: Response) => {
	const setting = await SiteSetting.findOne({ key: 'site' }).select('promoBannerImage promoPopupImage').lean();
	res.status(200).json({ success: true, data: designView(setting) });
});

/** PUT /api/promos/design/:slot (multipart `image`): sets the banner or pop-up picture (replaces the old one). */
export const updatePromoDesign = asyncHandler(async (req: Request, res: Response) => {
	const field = DESIGN_SLOTS[designSlot(req.params.slot)];
	if (!req.file) throw new AppError('Choose a picture', 400);
	const previous = await SiteSetting.findOne({ key: 'site' }).select(field).lean();
	const image = await uploadToCloudinary(req.file.buffer, 'medhabee/promos');
	const setting = await SiteSetting.findOneAndUpdate(
		{ key: 'site' },
		{ $set: { [field]: { url: image.url, publicId: image.publicId }, updatedBy: req.user._id } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).lean();
	const oldId = previous?.[field]?.publicId;
	if (oldId) await deleteFromCloudinary(oldId);
	res.status(200).json({ success: true, message: 'Promo picture saved', data: designView(setting) });
});

/** DELETE /api/promos/design/:slot: back to the default design for the banner or pop-up. */
export const deletePromoDesign = asyncHandler(async (req: Request, res: Response) => {
	const field = DESIGN_SLOTS[designSlot(req.params.slot)];
	const previous = await SiteSetting.findOne({ key: 'site' }).select(field).lean();
	const setting = await SiteSetting.findOneAndUpdate(
		{ key: 'site' },
		{ $unset: { [field]: 1 }, $set: { updatedBy: req.user._id } },
		{ new: true, upsert: true, setDefaultsOnInsert: true },
	).lean();
	const oldId = previous?.[field]?.publicId;
	if (oldId) await deleteFromCloudinary(oldId);
	res.status(200).json({ success: true, message: 'Promo picture removed', data: designView(setting) });
});

/** GET /api/promos/:id/history: every switch on / off of the promo (who, when), newest first. */
export const getPromoHistory = asyncHandler(async (req: Request, res: Response) => {
	const id = assertId(req.params.id);
	if (!(await Promo.exists({ _id: id }))) throw new AppError('Promo not found', 404);
	res.status(200).json({ success: true, data: await auditHistory('Promo', id) });
});
