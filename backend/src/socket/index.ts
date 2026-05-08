import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { config } from '../config/env';
import { User } from '../models/User.model';
import { ChatConversation } from '../models/ChatConversation.model';
import { ChatMessage } from '../models/ChatMessage.model';

const STAFF_ROLES = ['Super Admin', 'Admin', 'Moderator', 'Teacher'];
const onlineStudents = new Map<string, number>();
let ioInstance: Server | null = null;

export function getSocketIO(): Server | null {
	return ioInstance;
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

	// Authenticate socket via JWT cookie
	io.use(async (socket, next) => {
		try {
			const cookieStr = socket.handshake.headers.cookie ?? '';
			const match = cookieStr.match(/(?:^|;\s*)token=([^;]+)/);
			const token = match ? decodeURIComponent(match[1]) : null;
			if (!token) return next(new Error('Not authorized'));

			const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
			const user = await User.findById(decoded.id).select('-password').lean();
			if (!user) return next(new Error('Not authorized'));

			socket.data.user = user;
			next();
		} catch {
			next(new Error('Not authorized'));
		}
	});

	io.on('connection', async (socket) => {
		const user = socket.data.user as SocketUser;
		const isStaff = STAFF_ROLES.includes(user.role);
		await socket.join(`user:${user._id.toString()}`);

		if (isStaff) {
			await socket.join('staff');
			socket.emit('chat:presenceSnapshot', Array.from(onlineStudents.keys()));
		} else {
			let conv = await ChatConversation.findOne({ student: user._id });
			if (!conv) conv = await ChatConversation.create({ student: user._id });
			await socket.join(`conv:${(conv._id as Types.ObjectId).toString()}`);

			const studentId = user._id.toString();
			const connectionCount = onlineStudents.get(studentId) ?? 0;
			onlineStudents.set(studentId, connectionCount + 1);
			if (connectionCount === 0) {
				io.to('staff').emit('chat:presence', { studentId, isOnline: true });
			}
		}

		socket.on('chat:send', async (payload: { content: string; conversationId?: string }) => {
			const content = (payload?.content ?? '').trim();
			if (!content) return;

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
