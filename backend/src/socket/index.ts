import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '../config/env';
import { isTokenRevoked } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { ChatConversation } from '../models/ChatConversation.model';
import { ChatMessage } from '../models/ChatMessage.model';
import { GroupChatChannel } from '../models/GroupChatChannel.model';

// Support chat staff (teachers answer students too)
const STAFF_ROLES = ['Super Admin', 'Admin', 'Moderator', 'Teacher'];
// Group chat: only platform admins see every channel (same rule as the REST API); teachers are ordinary members
const GROUP_ADMIN_ROLES = ['Super Admin', 'Admin', 'Moderator'];
const MAX_CHAT_MESSAGE_LENGTH = 2000;

const isValidId = (value: unknown): value is string => typeof value === 'string' && Types.ObjectId.isValid(value);
const onlineStudents = new Map<string, number>();
let ioInstance: Server | null = null;

export function getSocketIO(): Server | null {
	return ioInstance;
}

/** Ends a user's live connections (role change, password reset, deleted account): they must sign in again. */
export function disconnectUserSockets(userId: string): void {
	ioInstance?.in(`user:${userId}`).disconnectSockets(true);
}

export function getOnlineStudentIds(): string[] {
	return Array.from(onlineStudents.keys());
}

interface SocketUser {
	_id: Types.ObjectId;
	name: string;
	role: string;
	avatar?: string;
}

export function setupSocketIO(httpServer: HttpServer): Server {
	const corsOrigin =
		config.nodeEnv === 'production'
			? config.clientUrl
			: /^http:\/\/localhost:\d+$/;

	const io = new Server(httpServer, {
		cors: { origin: corsOrigin, credentials: true },
	});
	ioInstance = io;

	// Authenticate socket via JWT cookie or auth.token
	io.use(async (socket, next) => {
		try {
			let token: string | null = null;
			const authToken = socket.handshake.auth?.token as string | undefined;
			if (authToken) {
				token = authToken;
			} else {
				const cookieStr = socket.handshake.headers.cookie ?? '';
				const match = cookieStr.match(/(?:^|;\s*)token=([^;]+)/);
				token = match ? decodeURIComponent(match[1]) : null;
			}
			if (!token) return next(new Error('Not authorized'));

			const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as { id: string; iat?: number };
			const user = await User.findById(decoded.id).select('-password +passwordChangedAt').lean();
			if (!user || isTokenRevoked(decoded, user.passwordChangedAt)) return next(new Error('Not authorized'));

			socket.data.user = user;
			next();
		} catch {
			next(new Error('Not authorized'));
		}
	});

	io.on('connection', async (socket) => {
		const user = socket.data.user as SocketUser;
		const isStaff = STAFF_ROLES.includes(user.role);
		const isGroupAdmin = GROUP_ADMIN_ROLES.includes(user.role);
		// An error here must never become an unhandled rejection (it would stop the whole server)
		try {
		await socket.join(`user:${user._id.toString()}`);

		if (isStaff) {
			await socket.join('staff');
			socket.emit('chat:presenceSnapshot', Array.from(onlineStudents.keys()));
		} else {
			let conv = await ChatConversation.findOne({ student: user._id });
			// Two tabs connecting at once can race on the unique index: the loser reads the winner's row
			if (!conv) conv = await ChatConversation.create({ student: user._id }).catch(() => ChatConversation.findOne({ student: user._id }));
			if (conv) await socket.join(`conv:${(conv._id as Types.ObjectId).toString()}`);

			const studentId = user._id.toString();
			const connectionCount = onlineStudents.get(studentId) ?? 0;
			onlineStudents.set(studentId, connectionCount + 1);
			if (connectionCount === 0) {
				io.to('staff').emit('chat:presence', { studentId, isOnline: true });
			}
		}
		const groupChannels = await GroupChatChannel.find({
			isArchived: false,
			...(isGroupAdmin ? {} : { isBlocked: false, 'members.user': user._id }),
		}).select('_id');
		groupChannels.forEach((channel) => {
			void socket.join(`group:${(channel._id as Types.ObjectId).toString()}`);
		});
		} catch {
			socket.disconnect(true);
			return;
		}

		socket.on('chat:send', async (payload: { content: string; conversationId?: string }) => {
			const content = typeof payload?.content === 'string' ? payload.content.trim() : '';
			if (!content) return;
			if (content.length > MAX_CHAT_MESSAGE_LENGTH) {
				socket.emit('chat:error', 'Message is too long');
				return;
			}

			try {
				let conv;
				if (isStaff && payload.conversationId) {
					conv = await ChatConversation.findById(payload.conversationId);
				} else {
					conv = await ChatConversation.findOne({ student: user._id });
					if (!conv) conv = await ChatConversation.create({ student: user._id });
				}
				if (!conv) return;

				const convId = (conv._id as Types.ObjectId).toString();

				const [msg] = await ChatMessage.create([
					{
						conversationId: conv._id,
						senderId: user._id,
						senderName: user.name,
						senderRole: user.role,
						senderAvatar: user.avatar ?? '',
						content,
					},
				]);

				const updateFields = isStaff
					? { lastMessage: content, lastMessageAt: new Date(), $inc: { unreadByStudent: 1 } }
					: { lastMessage: content, lastMessageAt: new Date(), $inc: { unreadByStaff: 1 } };

				await ChatConversation.findByIdAndUpdate(conv._id, updateFields);
				const updatedConv = await ChatConversation.findById(conv._id).populate(
					'student',
					'name avatar email',
				);

				const msgObj = msg.toObject();
				io.to(`conv:${convId}`).emit('chat:message', msgObj);
				io.to('staff').emit('chat:message', msgObj);
				io.to('staff').emit('chat:conversationUpdated', updatedConv);
			} catch {
				socket.emit('chat:error', 'Failed to send message');
			}
		});

		socket.on('chat:typing', async (payload: { conversationId?: string; isTyping?: boolean }) => {
			try {
				let conv;
				if (isStaff && payload?.conversationId) {
					conv = await ChatConversation.findById(payload.conversationId);
				} else {
					conv = await ChatConversation.findOne({ student: user._id });
				}
				if (!conv) return;

				const convId = (conv._id as Types.ObjectId).toString();
				const typingPayload = {
					conversationId: convId,
					userId: user._id.toString(),
					userName: user.name,
					userRole: user.role,
					isTyping: Boolean(payload?.isTyping),
				};

				if (isStaff) {
					socket.to(`conv:${convId}`).emit('chat:typing', typingPayload);
				} else {
					socket.to('staff').emit('chat:typing', typingPayload);
				}
			} catch {
				/* silent */
			}
		});

		socket.on('chat:markRead', async (payload: { conversationId: string }) => {
			const { conversationId } = payload ?? {};
			if (!conversationId) return;

			try {
				if (isStaff) {
					await ChatConversation.findByIdAndUpdate(conversationId, { unreadByStaff: 0 });
					const conv = await ChatConversation.findById(conversationId).populate(
						'student',
						'name avatar email',
					);
					io.to('staff').emit('chat:conversationUpdated', conv);
				} else {
					const conv = await ChatConversation.findOne({ student: user._id });
					if (conv) await ChatConversation.findByIdAndUpdate(conv._id, { unreadByStudent: 0 });
				}
			} catch {
				/* silent */
			}
		});

		socket.on('groupChat:joinRoom', async (payload: { channelId?: string }) => {
			const channelId = payload?.channelId;
			if (!isValidId(channelId)) return;
			try {
				const channel = await GroupChatChannel.findById(channelId);
				if (!channel) return;
				if (!isGroupAdmin && (channel.isArchived || channel.isBlocked || !channel.members.some((member) => member.user.toString() === user._id.toString()))) return;
				await socket.join(`group:${channelId}`);
			} catch {
				/* ignore: a bad request must not affect the server */
			}
		});

		socket.on('groupChat:typing', async (payload: { channelId?: string; isTyping?: boolean }) => {
			const channelId = payload?.channelId;
			if (!isValidId(channelId)) return;
			try {
				const channel = await GroupChatChannel.findById(channelId).select('members isArchived isBlocked');
				if (!channel) return;
				if (!isGroupAdmin && (channel.isArchived || channel.isBlocked || !channel.members.some((member) => member.user.toString() === user._id.toString()))) return;
				socket.to(`group:${channelId}`).emit('groupChat:typing', {
					channelId,
					userId: user._id.toString(),
					userName: user.name,
					userRole: user.role,
					isTyping: Boolean(payload?.isTyping),
				});
			} catch {
				/* ignore: a bad request must not affect the server */
			}
		});

		socket.on('disconnect', () => {
			if (isStaff) return;

			const studentId = user._id.toString();
			const connectionCount = onlineStudents.get(studentId) ?? 0;
			if (connectionCount <= 1) {
				onlineStudents.delete(studentId);
				io.to('staff').emit('chat:presence', { studentId, isOnline: false });
			} else {
				onlineStudents.set(studentId, connectionCount - 1);
			}
		});
	});

	return io;
}
