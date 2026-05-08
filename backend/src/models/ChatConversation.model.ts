import { model, Schema, type Document, type Types } from 'mongoose';

export interface IChatConversation extends Document {
	student: Types.ObjectId;
	unreadByStaff: number;
	unreadByStudent: number;
	lastMessage: string;
	lastMessageAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

const chatConversationSchema = new Schema<IChatConversation>(
	{
		student: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
		unreadByStaff: { type: Number, default: 0 },
		unreadByStudent: { type: Number, default: 0 },
		lastMessage: { type: String, default: '' },
		lastMessageAt: { type: Date, default: Date.now },
	},
	{ timestamps: true },
);

export const ChatConversation = model<IChatConversation>('ChatConversation', chatConversationSchema);
