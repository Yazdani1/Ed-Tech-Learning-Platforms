import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Notification, type INotification, type NotificationPriority } from '../models/Notification.model';
import { User } from '../models/User.model';
import type { UserRole } from '../types/index';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { getSocketIO } from '../socket/index';

const USER_ROLES: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
const PRIORITIES: NotificationPriority[] = ['Low', 'Normal', 'High', 'Urgent'];
type NotificationObject = {
	recipients: Array<{ user: { toString: () => string }; readAt?: Date }>;
	[key: string]: unknown;
};

const sanitizeRoles = (roles: unknown): UserRole[] => {
	if (!Array.isArray(roles)) return [];
	return Array.from(new Set(roles.filter((role): role is UserRole => USER_ROLES.includes(role))));
};

const formatNotificationForUser = (
	notification: INotification & { toObject: () => NotificationObject },
	userId: string,
) => {
	const obj = notification.toObject();
	const recipient = obj.recipients.find(
		(item: { user: { toString: () => string }; readAt?: Date }) => item.user.toString() === userId,
	);
	return {
		...obj,
		isRead: Boolean(recipient?.readAt),
		readAt: recipient?.readAt ?? null,
	};
};

export const createNotification = asyncHandler(async (req: Request, res: Response) => {
	const {
		title,
		message,
		priority = 'Normal',
		targetRoles,
	} = req.body as {
		title?: string;
		message?: string;
		priority?: NotificationPriority;
		targetRoles?: UserRole[];
	};

	if (!title?.trim()) throw new AppError('Notification title is required', 400);
	if (!message?.trim()) throw new AppError('Notification message is required', 400);
	if (!PRIORITIES.includes(priority)) throw new AppError('Invalid notification priority', 400);

	const roles = sanitizeRoles(targetRoles);
	if (roles.length === 0) throw new AppError('Select at least one recipient role', 400);

	const users = await User.find({ role: { $in: roles } }).select('_id').lean();
	if (users.length === 0) throw new AppError('No users found for the selected roles', 400);

	const notification = await Notification.create({
		title: title.trim(),
		message: message.trim(),
		priority,
		targetRoles: roles,
		sentBy: req.user._id,
		recipients: users.map((user) => ({ user: user._id })),
	});

	const populated = await Notification.findById(notification._id).populate('sentBy', 'name role avatar');
	const io = getSocketIO();
	if (io && populated) {
		users.forEach((user) => {
			io.to(`user:${user._id.toString()}`).emit('notification:new', {
				notification: formatNotificationForUser(populated, user._id.toString()),
			});
		});
	}

	res.status(201).json({
		success: true,
		message: `Notification sent to ${users.length} user${users.length === 1 ? '' : 's'}`,
		data: populated,
	});
});

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user._id.toString();
	const notifications = await Notification.find({ 'recipients.user': req.user._id })
		.populate('sentBy', 'name role avatar')
		.sort({ createdAt: -1 })
		.limit(100);

	res.status(200).json({
		success: true,
		data: notifications.map((notification) => formatNotificationForUser(notification, userId)),
		total: notifications.length,
	});
});

export const getUnreadNotificationCount = asyncHandler(async (req: Request, res: Response) => {
	const count = await Notification.countDocuments({
		recipients: { $elemMatch: { user: req.user._id, readAt: { $exists: false } } },
	});
	res.status(200).json({ success: true, data: { count } });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
	const id = String(req.params.id);
	if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid notification id', 400);

	const notification = await Notification.findOneAndUpdate(
		{
			_id: id,
			recipients: { $elemMatch: { user: req.user._id } },
		},
		{ $set: { 'recipients.$.readAt': new Date() } },
		{ new: true },
	).populate('sentBy', 'name role avatar');

	if (!notification) throw new AppError('Notification not found', 404);

	res.status(200).json({
		success: true,
		message: 'Notification marked as read',
		data: formatNotificationForUser(notification, req.user._id.toString()),
	});
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
	await Notification.updateMany(
		{
			recipients: { $elemMatch: { user: req.user._id, readAt: { $exists: false } } },
		},
		{ $set: { 'recipients.$[recipient].readAt': new Date() } },
		{ arrayFilters: [{ 'recipient.user': req.user._id, 'recipient.readAt': { $exists: false } }] },
	);

	res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

export const getSentNotifications = asyncHandler(async (req: Request, res: Response) => {
	const notifications = await Notification.find()
		.populate('sentBy', 'name role avatar')
		.sort({ createdAt: -1 })
		.limit(100);

	res.status(200).json({ success: true, data: notifications, total: notifications.length });
});
