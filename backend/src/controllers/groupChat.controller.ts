import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { GroupChatChannel, type IGroupChatChannel } from '../models/GroupChatChannel.model';
import { GroupChatMessage } from '../models/GroupChatMessage.model';
import { User } from '../models/User.model';
import { uploadFileToCloudinary } from '../config/cloudinary';
import { getSocketIO } from '../socket/index';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'];
const populateChannel = [
	{ path: 'creator', select: 'name avatar role' },
	{ path: 'members.user', select: 'name avatar role' },
	{ path: 'joinRequests.user', select: 'name avatar role' },
];

const isPlatformAdmin = (role?: string) => Boolean(role && ADMIN_ROLES.includes(role));
const idEquals = (a: unknown, b: unknown) => String(a) === String(b);

const isChannelAdmin = (channel: IGroupChatChannel, userId: string) =>
	channel.members.some((member) => idEquals(member.user, userId) && member.role === 'Admin');

const isChannelMember = (channel: IGroupChatChannel, userId: string) =>
	channel.members.some((member) => idEquals(member.user, userId));

const ensureChannelAccess = (channel: IGroupChatChannel, req: Request) => {
	if (isPlatformAdmin(req.user.role)) return;
	if (channel.isArchived || channel.isBlocked) throw new AppError('Channel is not available', 403);
	if (!isChannelMember(channel, String(req.user._id))) throw new AppError('You are not a member of this channel', 403);
};

const ensureChannelAdmin = (channel: IGroupChatChannel, req: Request) => {
	if (isPlatformAdmin(req.user.role)) return;
	if (!isChannelAdmin(channel, String(req.user._id))) throw new AppError('Only channel admins can perform this action', 403);
};

const emitChannelUpdated = async (channelId: string) => {
	const channel = await GroupChatChannel.findById(channelId).populate(populateChannel).lean();
	if (!channel) return;
	getSocketIO()?.to(`group:${channelId}`).emit('groupChat:channelUpdated', channel);
};

export const getChannels = asyncHandler(async (req: Request, res: Response) => {
	const { search, archived } = req.query as Record<string, string>;
	const query: Record<string, unknown> = {};
	const admin = isPlatformAdmin(req.user.role);
	if (!admin) {
		query.isArchived = false;
		query.isBlocked = false;
		query['members.user'] = req.user._id;
	} else if (archived === 'true') {
		query.isArchived = true;
	}
	if (search?.trim()) {
		query.$or = [
			{ name: { $regex: search.trim(), $options: 'i' } },
			{ description: { $regex: search.trim(), $options: 'i' } },
		];
	}

	const channels = await GroupChatChannel.find(query).sort({ lastMessageAt: -1 }).populate(populateChannel).lean();
	res.status(200).json({ success: true, data: channels });
});

export const discoverChannels = asyncHandler(async (req: Request, res: Response) => {
	const search = req.query.search ? String(req.query.search).trim() : '';
	const query: Record<string, unknown> = { isArchived: false, isBlocked: false };
	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ description: { $regex: search, $options: 'i' } },
		];
	}
	const channels = await GroupChatChannel.find(query).sort({ lastMessageAt: -1 }).limit(30).populate(populateChannel).lean();
	res.status(200).json({ success: true, data: channels });
});

export const createChannel = asyncHandler(async (req: Request, res: Response) => {
	const { name, description, type } = req.body as { name?: string; description?: string; type?: string };
	if (!name?.trim()) throw new AppError('Channel name is required', 400);
	if (!['Public', 'Private'].includes(type ?? '')) throw new AppError('Channel type is required', 400);
	const channelType = type as 'Public' | 'Private';

	const channel = await GroupChatChannel.create({
		name: name.trim(),
		description: description?.trim() ?? '',
		type: channelType,
		creator: req.user._id,
		members: [{ user: req.user._id, role: 'Admin', unreadCount: 0, joinedAt: new Date() }],
	});
	const populated = await GroupChatChannel.findById(channel._id as Types.ObjectId).populate(populateChannel);
	res.status(201).json({ success: true, message: 'Channel created', data: populated });
});

export const updateChannel = asyncHandler(async (req: Request, res: Response) => {
	const { name, description, type } = req.body as { name?: string; description?: string; type?: string };
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	if (!isPlatformAdmin(req.user.role) && !idEquals(channel.creator, req.user._id)) throw new AppError('Not authorized', 403);
	if (!name?.trim()) throw new AppError('Channel name is required', 400);
	if (!['Public', 'Private'].includes(type ?? '')) throw new AppError('Channel type is required', 400);

	channel.name = name.trim();
	channel.description = description?.trim() ?? '';
	channel.type = type as 'Public' | 'Private';
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
	res.status(200).json({ success: true, message: 'Channel updated', data: populated });
});

export const joinChannel = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel || channel.isArchived || channel.isBlocked) throw new AppError('Channel not found', 404);
	if (isChannelMember(channel, String(req.user._id))) {
		res.status(200).json({ success: true, message: 'Already a member', data: channel });
		return;
	}

	if (channel.type === 'Public') {
		channel.members.push({ user: req.user._id, role: 'Member', unreadCount: 0, joinedAt: new Date() });
		await channel.save();
		await emitChannelUpdated(String(channel._id));
		const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
		res.status(200).json({ success: true, message: 'Joined channel', data: populated });
		return;
	}

	const existing = channel.joinRequests.find((request) => idEquals(request.user, req.user._id) && request.status === 'Pending');
	if (!existing) {
		channel.joinRequests.push({ user: req.user._id, status: 'Pending', requestedAt: new Date() });
		await channel.save();
		await emitChannelUpdated(String(channel._id));
	}
	const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
	res.status(200).json({ success: true, message: 'Join request sent', data: populated });
});

export const approveJoinRequest = asyncHandler(async (req: Request, res: Response) => {
	const requestedUserId = String(req.params.userId);
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	ensureChannelAdmin(channel, req);

	const request = channel.joinRequests.find((item) => idEquals(item.user, requestedUserId) && item.status === 'Pending');
	if (!request) throw new AppError('Join request not found', 404);
	request.status = 'Approved';
	request.respondedAt = new Date();
	if (!isChannelMember(channel, requestedUserId)) {
		channel.members.push({ user: new Types.ObjectId(requestedUserId), role: 'Member', unreadCount: 0, joinedAt: new Date() });
	}
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
	res.status(200).json({ success: true, message: 'Join request approved', data: populated });
});

export const cancelJoinRequest = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel || channel.isArchived || channel.isBlocked) throw new AppError('Channel not found', 404);
	if (isChannelMember(channel, String(req.user._id))) throw new AppError('You are already a member of this channel', 400);

	const beforeCount = channel.joinRequests.length;
	channel.joinRequests = channel.joinRequests.filter((request) => !idEquals(request.user, req.user._id) || request.status !== 'Pending');
	if (channel.joinRequests.length === beforeCount) throw new AppError('Pending join request not found', 404);

	await channel.save();
	await emitChannelUpdated(String(channel._id));
	const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
	res.status(200).json({ success: true, message: 'Join request cancelled', data: populated });
});

export const addMembers = asyncHandler(async (req: Request, res: Response) => {
	const { userIds } = req.body as { userIds?: string[] };
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	ensureChannelAdmin(channel, req);
	if (!Array.isArray(userIds) || userIds.length === 0) throw new AppError('Select at least one user', 400);

	const existingIds = new Set(channel.members.map((member) => String(member.user)));
	userIds.forEach((userId) => {
		if (Types.ObjectId.isValid(userId) && !existingIds.has(userId)) {
			channel.members.push({ user: new Types.ObjectId(userId), role: 'Member', unreadCount: 0, joinedAt: new Date() });
		}
	});
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
	res.status(200).json({ success: true, message: 'Members added', data: populated });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	ensureChannelAdmin(channel, req);
	if (idEquals(channel.creator, req.params.userId)) throw new AppError('Channel creator cannot be removed', 400);

	channel.members = channel.members.filter((member) => !idEquals(member.user, req.params.userId));
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
	res.status(200).json({ success: true, message: 'Member removed', data: populated });
});

export const leaveChannel = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	if (idEquals(channel.creator, req.user._id)) throw new AppError('Channel creator cannot leave the channel', 400);

	channel.members = channel.members.filter((member) => !idEquals(member.user, req.user._id));
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	res.status(200).json({ success: true, message: 'Left channel' });
});

export const archiveChannel = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	if (!isPlatformAdmin(req.user.role) && !idEquals(channel.creator, req.user._id)) throw new AppError('Not authorized', 403);
	channel.isArchived = true;
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	res.status(200).json({ success: true, message: 'Channel archived', data: channel });
});

export const toggleBlockChannel = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	if (!isPlatformAdmin(req.user.role)) throw new AppError('Not authorized', 403);
	channel.isBlocked = !channel.isBlocked;
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	const populated = await GroupChatChannel.findById(channel._id).populate(populateChannel);
	res.status(200).json({ success: true, message: channel.isBlocked ? 'Channel blocked' : 'Channel unblocked', data: populated });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	ensureChannelAccess(channel, req);
	const messages = await GroupChatMessage.find({ channel: channel._id }).sort({ createdAt: 1 }).limit(200);
	res.status(200).json({ success: true, data: messages });
});

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	ensureChannelAccess(channel, req);
	if (channel.isBlocked) throw new AppError('Channel is blocked', 403);

	const content = String(req.body.content ?? '').trim();
	const files = (req.files as Express.Multer.File[] | undefined) ?? [];
	if (!content && files.length === 0) throw new AppError('Message or file is required', 400);

	const attachments = await Promise.all(
		files.map(async (file) => {
			const uploaded = await uploadFileToCloudinary(file.buffer, 'medhabee/group-chat');
			return {
				url: uploaded.url,
				publicId: uploaded.publicId,
				resourceType: uploaded.resourceType,
				fileName: file.originalname,
				mimeType: file.mimetype,
				size: file.size,
			};
		}),
	);
	const [message] = await GroupChatMessage.create([{
		channel: channel._id,
		sender: req.user._id,
		senderName: req.user.name,
		senderRole: req.user.role,
		senderAvatar: req.user.avatar ?? '',
		content,
		attachments,
	}]);

	channel.lastMessage = content || (attachments.length === 1 ? attachments[0].fileName : `${attachments.length} files`);
	channel.lastMessageAt = new Date();
	channel.members.forEach((member) => {
		if (!idEquals(member.user, req.user._id)) member.unreadCount += 1;
	});
	await channel.save();
	const populatedChannel = await GroupChatChannel.findById(channel._id).populate(populateChannel).lean();
	const messageObject = message.toObject();
	getSocketIO()?.to(`group:${String(channel._id)}`).emit('groupChat:message', messageObject);
	getSocketIO()?.to(`group:${String(channel._id)}`).emit('groupChat:channelUpdated', populatedChannel);
	res.status(201).json({ success: true, message: 'Message sent', data: messageObject });
});

export const markChannelRead = asyncHandler(async (req: Request, res: Response) => {
	const channel = await GroupChatChannel.findById(req.params.channelId);
	if (!channel) throw new AppError('Channel not found', 404);
	ensureChannelAccess(channel, req);
	const member = channel.members.find((item) => idEquals(item.user, req.user._id));
	if (member) member.unreadCount = 0;
	await channel.save();
	await emitChannelUpdated(String(channel._id));
	res.status(200).json({ success: true });
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
	const search = req.query.search ? String(req.query.search).trim() : '';
	if (!search) {
		res.status(200).json({ success: true, data: [] });
		return;
	}
	const users = await User.find({
		_id: { $ne: req.user._id },
		$or: [
			{ name: { $regex: search, $options: 'i' } },
			{ email: { $regex: search, $options: 'i' } },
		],
	})
		.select('name avatar role email')
		.limit(20)
		.lean();
	res.status(200).json({ success: true, data: users });
});
