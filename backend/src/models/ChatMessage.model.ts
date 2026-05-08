import { model, Schema, type Document, type Types } from 'mongoose';

export interface IChatMessage extends Document {
	conversationId: Types.ObjectId;
	senderId: Types.ObjectId;
	senderName: string;
	senderRole: string;
	senderAvatar: string;
	content: string;
	createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
	{
		conversationId: {
			type: Schema.Types.ObjectId,
			ref: 'ChatConversation',
			required: true,
			index: true,
		},
		senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		senderName: { type: String, required: true },
		senderRole: { type: String, required: true },
		senderAvatar: { type: String, default: '' },
		content: { type: String, required: true, trim: true },
	},
	{ timestamps: true },
);

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
