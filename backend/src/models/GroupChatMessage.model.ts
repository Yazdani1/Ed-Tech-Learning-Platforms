import { model, Schema, type Document, type Types } from 'mongoose';

export interface IGroupChatAttachment {
	url: string;
	publicId: string;
	fileName: string;
	mimeType: string;
	size: number;
	resourceType: string;
}

export interface IGroupChatMessage extends Document {
	channel: Types.ObjectId;
	sender: Types.ObjectId;
	senderName: string;
	senderRole: string;
	senderAvatar: string;
	content: string;
	attachments: IGroupChatAttachment[];
	createdAt: Date;
	updatedAt: Date;
}

const groupChatAttachmentSchema = new Schema<IGroupChatAttachment>(
	{
		url: { type: String, required: true },
		publicId: { type: String, required: true },
		fileName: { type: String, required: true },
		mimeType: { type: String, required: true },
		size: { type: Number, required: true },
		resourceType: { type: String, required: true },
	},
	{ _id: false },
);

const groupChatMessageSchema = new Schema<IGroupChatMessage>(
	{
		channel: { type: Schema.Types.ObjectId, ref: 'GroupChatChannel', required: true, index: true },
		sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		senderName: { type: String, required: true },
		senderRole: { type: String, required: true },
		senderAvatar: { type: String, default: '' },
		content: { type: String, default: '', trim: true },
		attachments: { type: [groupChatAttachmentSchema], default: [] },
	},
	{ timestamps: true },
);

export const GroupChatMessage = model<IGroupChatMessage>('GroupChatMessage', groupChatMessageSchema);
