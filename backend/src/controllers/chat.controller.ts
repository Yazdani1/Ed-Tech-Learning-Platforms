import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { ChatConversation } from '../models/ChatConversation.model';
import { ChatMessage } from '../models/ChatMessage.model';

const STAFF_ROLES = ['Super Admin', 'Admin', 'Moderator', 'Teacher'];

// GET /api/chat/conversations
// Staff: all conversations sorted by activity. Student: their own (created if absent).
export const getConversations = asyncHandler(async (req: Request, res: Response) => {
	const user = req.user;
	const isStaff = STAFF_ROLES.includes(user.role);

	if (isStaff) {
		// Teachers answer support chat but do not get the students' email addresses.
		const conversations = await ChatConversation.find()
			.populate('student', user.role === 'Teacher' ? 'name avatar' : 'name avatar email')
			.sort({ lastMessageAt: -1 });
		res.json({ success: true, data: conversations });
	} else {
		let conv = await ChatConversation.findOne({ student: user._id }).populate(
			'student',
			'name avatar email',
		);
		if (!conv) {
			await ChatConversation.create({ student: user._id });
			conv = await ChatConversation.findOne({ student: user._id }).populate(
				'student',
				'name avatar email',
			);
		}
		res.json({ success: true, data: conv });
	}
});

// GET /api/chat/conversations/:id/messages
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const user = req.user;
	const isStaff = STAFF_ROLES.includes(user.role);

	const conv = await ChatConversation.findById(id);
	if (!conv) throw new AppError('Conversation not found', 404);

	if (!isStaff && conv.student.toString() !== user._id.toString()) {
		throw new AppError('Not authorized', 403);
	}

	const messages = await ChatMessage.find({ conversationId: id }).sort({ createdAt: 1 });
	res.json({ success: true, data: messages });
});
