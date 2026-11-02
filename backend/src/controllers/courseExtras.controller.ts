import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Course, type ICourse } from '../models/Course.model';
import { Tool } from '../models/Tool.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import {
	COURSE_EXTRAS_FOLDER,
	extrasImageIds,
	parseAudience,
	parseBenefitsSection,
	parseFaqs,
	parseProjects,
	parseSuccessStories,
	parseToolsSection,
} from '../utils/courseExtras';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary';

const EXTRAS_PARSERS = {
	toolsSection: parseToolsSection,
	benefitsSection: parseBenefitsSection,
	projects: parseProjects,
	audience: parseAudience,
	successStories: parseSuccessStories,
	faqs: parseFaqs,
} as const;
type ExtrasField = keyof typeof EXTRAS_PARSERS;
type ExtrasUpdates = Partial<Pick<ICourse, ExtrasField>>;
const EXTRAS_FIELDS = Object.keys(EXTRAS_PARSERS) as ExtrasField[];

const findCourse = async (id: string) => {
	if (!Types.ObjectId.isValid(id)) throw new AppError('Course not found', 404);
	const course = await Course.findById(id);
	if (!course) throw new AppError('Course not found', 404);
	return course;
};

// POST /api/courses/:id/images — multipart "image": one picture for a course section (Super Admin, Admin)
export const uploadCourseExtrasImage = asyncHandler(async (req: Request, res: Response) => {
	await findCourse(String(req.params.id));
	if (!req.file) throw new AppError('Image is required', 400);
	const uploaded = await uploadToCloudinary(req.file.buffer, COURSE_EXTRAS_FOLDER);
	res.status(201).json({
		success: true,
		message: 'Image uploaded',
		data: { url: uploaded.url, publicId: uploaded.publicId },
	});
});

// PATCH /api/courses/:id/extras — any of the course page sections, each replaced as a whole (Super Admin, Admin)
export const updateCourseExtras = asyncHandler(async (req: Request, res: Response) => {
	const body = req.body as Record<string, unknown>;
	const keys = Object.keys(body ?? {});
	if (keys.length === 0) throw new AppError('Nothing to update', 400);
	const unknown = keys.find((key) => !EXTRAS_FIELDS.includes(key as ExtrasField));
	if (unknown) throw new AppError(`Unknown field: ${unknown}`, 400);

	const course = await findCourse(String(req.params.id));
	const updates: ExtrasUpdates = {};
	for (const field of keys as ExtrasField[]) Object.assign(updates, { [field]: EXTRAS_PARSERS[field](body[field]) });

	const { toolsSection } = updates;
	if (toolsSection && toolsSection.tools.length > 0) {
		const found = await Tool.countDocuments({ _id: { $in: toolsSection.tools } });
		if (found !== toolsSection.tools.length) throw new AppError('One or more tools do not exist', 400);
	}

	const before = new Set(extrasImageIds(course));
	// A picture of another course cannot be reused here (removing it later would delete it from that course)
	const added = extrasImageIds(updates).filter((id) => !before.has(id));
	if (added.length > 0) {
		const usedElsewhere = await Course.exists({
			_id: { $ne: course._id },
			$or: [
				{ 'benefitsSection.items.icon.publicId': { $in: added } },
				{ 'projects.images.publicId': { $in: added } },
				{ 'successStories.photo.publicId': { $in: added } },
				{ 'successStories.companyLogo.publicId': { $in: added } },
			],
		});
		if (usedElsewhere) throw new AppError('An image belongs to another course; upload it again', 400);
	}

	course.set(updates);
	await course.save();
	// Pictures no longer used by any section are removed from Cloudinary
	const after = new Set(extrasImageIds(course));
	// The save already succeeded: a failed cleanup must not turn it into an error
	await Promise.allSettled([...before].filter((id) => !after.has(id)).map((id) => deleteFromCloudinary(id)));

	const saved = await Course.findById(course._id)
		.select(EXTRAS_FIELDS.join(' '))
		.populate('toolsSection.tools', 'name logoUrl')
		.lean();
	res.status(200).json({ success: true, message: 'Course sections updated', data: saved });
});
