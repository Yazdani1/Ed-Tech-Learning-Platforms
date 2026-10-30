import type { Request, Response } from 'express';
import { StudySchedule, type ScheduleStatus } from '../models/StudySchedule.model';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

type TimerInput = {
	title?: string;
	description?: string;
	duration?: number;
};

type ReminderInput = {
	title?: string;
	description?: string;
	startDateTime?: string;
	endDateTime?: string;
};

type UpdateInput = {
	status?: string;
	elapsedSeconds?: number;
	completedAt?: string;
	firedAt?: string;
	title?: string;
	description?: string;
	startDateTime?: string;
	endDateTime?: string | null;
};

export const getMySchedules = asyncHandler(async (req: Request, res: Response) => {
	const { type, status } = req.query as Record<string, string>;

	const filter: Record<string, unknown> = { user: req.user._id };
	if (type) filter.type = type;
	if (status) filter.status = status;

	const schedules = await StudySchedule.find(filter).sort({ createdAt: -1 });
	res.status(200).json({ success: true, data: schedules, total: schedules.length });
});

export const createTimer = asyncHandler(async (req: Request, res: Response) => {
	const { title, description, duration } = req.body as TimerInput;

	if (typeof title !== 'string' || !title.trim()) throw new AppError('Title is required', 400);
	if (!duration || duration <= 0) throw new AppError('Duration must be greater than 0', 400);
	if (description !== undefined && typeof description !== 'string') throw new AppError('Description must be text', 400);

	const timer = await StudySchedule.create({
		user: req.user._id,
		type: 'timer',
		title: title.trim(),
		description: description?.trim() ?? '',
		duration,
		elapsedSeconds: 0,
		status: 'active',
	});

	res.status(201).json({ success: true, message: 'Timer created', data: timer });
});

export const createReminder = asyncHandler(async (req: Request, res: Response) => {
	const { title, description, startDateTime, endDateTime } = req.body as ReminderInput;

	if (typeof title !== 'string' || !title.trim()) throw new AppError('Title is required', 400);
	if (!startDateTime) throw new AppError('Start date/time is required', 400);
	if (description !== undefined && typeof description !== 'string') throw new AppError('Description must be text', 400);

	const start = new Date(startDateTime);
	if (isNaN(start.getTime())) throw new AppError('Invalid start date/time', 400);

	let end: Date | undefined;
	if (endDateTime) {
		end = new Date(endDateTime);
		if (isNaN(end.getTime())) throw new AppError('Invalid end date/time', 400);
		if (end <= start) throw new AppError('End time must be after start time', 400);
	}

	const reminder = await StudySchedule.create({
		user: req.user._id,
		type: 'reminder',
		title: title.trim(),
		description: description?.trim() ?? '',
		startDateTime: start,
		endDateTime: end,
		status: 'pending',
	});

	res.status(201).json({ success: true, message: 'Reminder created', data: reminder });
});

export const updateSchedule = asyncHandler(async (req: Request, res: Response) => {
	const schedule = await StudySchedule.findById(req.params.id);
	if (!schedule) throw new AppError('Schedule not found', 404);
	if (schedule.user.toString() !== String(req.user._id)) {
		throw new AppError('Not authorized', 403);
	}

	const { status, elapsedSeconds, completedAt, firedAt, title, description, startDateTime, endDateTime } =
		req.body as UpdateInput;

	const validStatuses: ScheduleStatus[] = ['pending', 'active', 'paused', 'completed', 'cancelled'];
	if (status && !validStatuses.includes(status as ScheduleStatus)) {
		throw new AppError('Invalid status', 400);
	}

	if (elapsedSeconds !== undefined && (typeof elapsedSeconds !== 'number' || !(elapsedSeconds >= 0))) {
		throw new AppError('Elapsed seconds must be a number of 0 or more', 400);
	}
	if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
		throw new AppError('Title is required', 400);
	}
	if (description !== undefined && typeof description !== 'string') {
		throw new AppError('Description must be text', 400);
	}

	if (status) schedule.status = status as ScheduleStatus;
	if (typeof elapsedSeconds === 'number') schedule.elapsedSeconds = elapsedSeconds;
	if (completedAt) schedule.completedAt = new Date(completedAt);
	if (firedAt) schedule.firedAt = new Date(firedAt);
	if (title !== undefined) schedule.title = title.trim();
	if (description !== undefined) schedule.description = description.trim();
	if (startDateTime !== undefined) schedule.startDateTime = new Date(startDateTime);
	if (endDateTime === null) schedule.endDateTime = undefined;
	else if (endDateTime !== undefined) schedule.endDateTime = new Date(endDateTime);
	if (schedule.startDateTime && schedule.endDateTime && schedule.endDateTime <= schedule.startDateTime) {
		throw new AppError('End time must be after start time', 400);
	}

	await schedule.save();
	res.status(200).json({ success: true, message: 'Schedule updated', data: schedule });
});

export const deleteSchedule = asyncHandler(async (req: Request, res: Response) => {
	const schedule = await StudySchedule.findById(req.params.id);
	if (!schedule) throw new AppError('Schedule not found', 404);
	if (schedule.user.toString() !== String(req.user._id)) {
		throw new AppError('Not authorized', 403);
	}

	await schedule.deleteOne();
	res.status(200).json({ success: true, message: 'Schedule deleted' });
});
