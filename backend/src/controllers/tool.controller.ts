import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Tool, type ITool } from '../models/Tool.model';
import { Course } from '../models/Course.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { escapeRegex } from '../utils/escapeRegex';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary';

const TOOL_NAME_MAX = 60;
const TOOL_FOLDER = 'medhabee/tools';

const parseName = (value: unknown): string => {
	if (typeof value !== 'string' || !value.trim()) throw new AppError('Tool name is required', 400);
	const name = value.trim();
	if (name.length > TOOL_NAME_MAX) throw new AppError(`Tool name must be at most ${TOOL_NAME_MAX} characters`, 400);
	return name;
};

const assertNameFree = async (name: string, exceptId?: Types.ObjectId) => {
	const existing = await Tool.findOne({
		name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
		...(exceptId ? { _id: { $ne: exceptId } } : {}),
	});
	if (existing) throw new AppError('A tool with this name already exists', 400);
};

const findTool = async (id: string) => {
	if (!Types.ObjectId.isValid(id)) throw new AppError('Tool not found', 404);
	const tool = await Tool.findById(id).select('+logoPublicId');
	if (!tool) throw new AppError('Tool not found', 404);
	return tool;
};

/** The tool without its Cloudinary id. */
const toolView = (tool: ITool) => ({
	_id: tool._id,
	name: tool.name,
	logoUrl: tool.logoUrl,
	createdAt: tool.createdAt,
	updatedAt: tool.updatedAt,
});

// GET /api/tools — every tool, by name (everyone)
export const getTools = asyncHandler(async (_req: Request, res: Response) => {
	const tools = await Tool.find().sort({ name: 1 }).select('name logoUrl createdAt updatedAt').lean();
	res.status(200).json({ success: true, data: tools, total: tools.length });
});

// POST /api/tools — multipart: name + logo image (Super Admin, Admin)
export const createTool = asyncHandler(async (req: Request, res: Response) => {
	const name = parseName(req.body.name);
	if (!req.file) throw new AppError('Tool logo is required', 400);
	await assertNameFree(name);
	const uploaded = await uploadToCloudinary(req.file.buffer, TOOL_FOLDER);
	const tool = await Tool.create({
		name,
		logoUrl: uploaded.url,
		logoPublicId: uploaded.publicId,
		createdBy: req.user._id,
	});
	res.status(201).json({ success: true, message: 'Tool created', data: toolView(tool) });
});

// PUT /api/tools/:id — multipart: name and/or a new logo (Super Admin, Admin)
export const updateTool = asyncHandler(async (req: Request, res: Response) => {
	const tool = await findTool(String(req.params.id));
	if (req.body.name !== undefined) {
		const name = parseName(req.body.name);
		await assertNameFree(name, tool._id as Types.ObjectId);
		tool.name = name;
	}
	const oldLogoId = req.file ? tool.logoPublicId : undefined;
	if (req.file) {
		const uploaded = await uploadToCloudinary(req.file.buffer, TOOL_FOLDER);
		tool.logoUrl = uploaded.url;
		tool.logoPublicId = uploaded.publicId;
	}
	await tool.save();
	// The old logo goes only once the new one is saved
	if (oldLogoId) await deleteFromCloudinary(oldLogoId);
	res.status(200).json({ success: true, message: 'Tool updated', data: toolView(tool) });
});

// DELETE /api/tools/:id — also removes the tool from every course that lists it (Super Admin, Admin)
export const deleteTool = asyncHandler(async (req: Request, res: Response) => {
	const tool = await findTool(String(req.params.id));
	await tool.deleteOne();
	await Course.updateMany({ 'toolsSection.tools': tool._id }, { $pull: { 'toolsSection.tools': tool._id } });
	await deleteFromCloudinary(tool.logoPublicId);
	res.status(200).json({ success: true, message: 'Tool deleted' });
});
