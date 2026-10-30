import type { Request, Response } from 'express';
import { HomeHeroPost, type HomeHeroPostVisibility } from '../models/HomeHeroPost.model';
import { SiteLogo } from '../models/SiteLogo.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary';

const parseVisibility = (value: unknown): HomeHeroPostVisibility => (value === 'Public' ? 'Public' : 'Private');

const parsePublishAt = (value: unknown): Date | undefined => {
	if (!value) return undefined;
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) throw new AppError('Invalid publish date', 400);
	return date;
};

const applyDueHeroSchedules = async () => {
	const now = new Date();
	const duePosts = await HomeHeroPost.find({
		scheduledVisibility: { $in: ['Public', 'Private'] },
		publishAt: { $lte: now },
	});

	await Promise.all(
		duePosts.map((post) => {
			post.visibility = post.scheduledVisibility as HomeHeroPostVisibility;
			post.scheduledVisibility = undefined;
			post.publishAt = undefined;
			return post.save();
		}),
	);
};

export const getPublicHomeHeroPosts = asyncHandler(async (_req: Request, res: Response) => {
	await applyDueHeroSchedules();
	const now = new Date();
	const posts = await HomeHeroPost.find({
		$or: [
			{
				visibility: 'Public',
				scheduledVisibility: 'Private',
				publishAt: { $gt: now },
			},
			{
				visibility: 'Public',
				$and: [
					{ $or: [{ scheduledVisibility: { $exists: false } }, { scheduledVisibility: null }] },
					{ $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: now } }] },
				],
			},
			{
				scheduledVisibility: 'Public',
				publishAt: { $lte: now },
			},
		],
	})
		.sort({ order: 1, createdAt: -1 })
		.select('imageUrl imageWidth imageHeight order')
		.lean();

	res.status(200).json({ success: true, data: posts });
});

export const getPublicSiteLogo = asyncHandler(async (_req: Request, res: Response) => {
	const logo = await SiteLogo.findOne()
		.sort({ updatedAt: -1 })
		.select('imageUrl imageWidth imageHeight updatedAt')
		.lean();

	res.status(200).json({ success: true, data: logo });
});

export const getAdminSiteLogo = asyncHandler(async (_req: Request, res: Response) => {
	const logo = await SiteLogo.findOne()
		.sort({ updatedAt: -1 })
		.populate('updatedBy', 'name role')
		.lean();

	res.status(200).json({ success: true, data: logo });
});

export const updateSiteLogo = asyncHandler(async (req: Request, res: Response) => {
	const file = req.file;
	if (!file) throw new AppError('Logo image is required', 400);

	const currentLogo = await SiteLogo.findOne().sort({ updatedAt: -1 });
	const uploaded = await uploadToCloudinary(file.buffer, 'medhabee/site-logo');

	if (currentLogo) {
		await deleteFromCloudinary(currentLogo.imagePublicId);
		currentLogo.imageUrl = uploaded.url;
		currentLogo.imagePublicId = uploaded.publicId;
		currentLogo.imageWidth = uploaded.width;
		currentLogo.imageHeight = uploaded.height;
		currentLogo.updatedBy = req.user._id;
		await currentLogo.save();
		res.status(200).json({ success: true, message: 'Logo updated', data: currentLogo });
		return;
	}

	const logo = await SiteLogo.create({
		imageUrl: uploaded.url,
		imagePublicId: uploaded.publicId,
		imageWidth: uploaded.width,
		imageHeight: uploaded.height,
		updatedBy: req.user._id,
	});

	res.status(201).json({ success: true, message: 'Logo uploaded', data: logo });
});

export const getAdminHomeHeroPosts = asyncHandler(async (_req: Request, res: Response) => {
	await applyDueHeroSchedules();
	const posts = await HomeHeroPost.find()
		.sort({ order: 1, createdAt: -1 })
		.populate('createdBy', 'name role')
		.lean();

	res.status(200).json({ success: true, data: posts });
});

export const createHomeHeroPosts = asyncHandler(async (req: Request, res: Response) => {
	const uploadedFiles = req.files as
		| Express.Multer.File[]
		| Record<string, Express.Multer.File[]>
		| undefined;
	const files = Array.isArray(uploadedFiles)
		? uploadedFiles
		: Object.values(uploadedFiles ?? {}).flat();
	if (!files || files.length === 0) throw new AppError('At least one image is required', 400);

	const visibility = parseVisibility(req.body.visibility);
	const publishAt = parsePublishAt(req.body.publishAt);
	const hasFutureSchedule = Boolean(publishAt && publishAt.getTime() > Date.now());
	const maxOrder = await HomeHeroPost.findOne().sort({ order: -1 }).select('order').lean();
	let nextOrder = Number(req.body.order ?? (maxOrder?.order ?? -1) + 1);

	const posts = [];
	for (const file of files) {
		const uploaded = await uploadToCloudinary(file.buffer, 'medhabee/home-hero');
		const post = await HomeHeroPost.create({
			imageUrl: uploaded.url,
			imagePublicId: uploaded.publicId,
			imageWidth: uploaded.width,
			imageHeight: uploaded.height,
			visibility: hasFutureSchedule ? 'Private' : visibility,
			scheduledVisibility: hasFutureSchedule ? visibility : undefined,
			publishAt,
			order: nextOrder,
			createdBy: req.user._id,
		});
		posts.push(post);
		nextOrder += 1;
	}

	res.status(201).json({ success: true, message: 'Hero post uploaded', data: posts });
});

export const updateHomeHeroPost = asyncHandler(async (req: Request, res: Response) => {
	const post = await HomeHeroPost.findById(req.params.id);
	if (!post) throw new AppError('Hero post not found', 404);

	const file = req.file;
	if (file) {
		await deleteFromCloudinary(post.imagePublicId);
		const uploaded = await uploadToCloudinary(file.buffer, 'medhabee/home-hero');
		post.imageUrl = uploaded.url;
		post.imagePublicId = uploaded.publicId;
		post.imageWidth = uploaded.width;
		post.imageHeight = uploaded.height;
	}

	const requestedVisibility = req.body.visibility !== undefined ? parseVisibility(req.body.visibility) : undefined;
	const requestedPublishAt = req.body.publishAt !== undefined ? parsePublishAt(req.body.publishAt) : undefined;
	const hasFutureSchedule = Boolean(requestedPublishAt && requestedPublishAt.getTime() > Date.now());

	if (requestedVisibility !== undefined) {
		if (hasFutureSchedule) {
			post.scheduledVisibility = requestedVisibility;
			post.publishAt = requestedPublishAt;
		} else {
			post.visibility = requestedVisibility;
			post.scheduledVisibility = undefined;
			post.publishAt = undefined;
		}
	} else if (req.body.publishAt !== undefined) {
		post.publishAt = requestedPublishAt;
		if (!hasFutureSchedule) post.scheduledVisibility = undefined;
	}
	if (req.body.order !== undefined) post.order = Number(req.body.order) || 0;

	await post.save();
	res.status(200).json({ success: true, message: 'Hero post updated', data: post });
});

export const reorderHomeHeroPosts = asyncHandler(async (req: Request, res: Response) => {
	const orderedIds = Array.isArray(req.body.orderedIds) ? req.body.orderedIds.map(String) : [];
	if (orderedIds.length === 0) throw new AppError('orderedIds is required', 400);

	await Promise.all(
		orderedIds.map((id: string, index: number) =>
			HomeHeroPost.findByIdAndUpdate(id, { order: index }, { new: false }),
		),
	);

	res.status(200).json({ success: true, message: 'Hero posts reordered' });
});

export const deleteHomeHeroPost = asyncHandler(async (req: Request, res: Response) => {
	const post = await HomeHeroPost.findByIdAndDelete(req.params.id);
	if (!post) throw new AppError('Hero post not found', 404);

	await deleteFromCloudinary(post.imagePublicId);
	res.status(200).json({ success: true, message: 'Hero post deleted' });
});
