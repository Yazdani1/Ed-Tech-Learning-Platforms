import { model, Schema, type Document, type Types } from 'mongoose';

export type GroupChatChannelType = 'Public' | 'Private';
export type GroupChatMemberRole = 'Admin' | 'Member';

export interface IGroupChatMember {
	user: Types.ObjectId;
	role: GroupChatMemberRole;
	unreadCount: number;
	joinedAt: Date;
}

export interface IGroupChatJoinRequest {
	user: Types.ObjectId;
	status: 'Pending' | 'Approved' | 'Rejected';
	requestedAt: Date;
	respondedAt?: Date;
}

export interface IGroupChatChannel extends Document {
	name: string;
	description?: string;
	type: GroupChatChannelType;
	creator: Types.ObjectId;
	members: IGroupChatMember[];
	joinRequests: IGroupChatJoinRequest[];
	lastMessage: string;
	lastMessageAt: Date;
	isBlocked: boolean;
	isArchived: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const groupChatMemberSchema = new Schema<IGroupChatMember>(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
		unreadCount: { type: Number, default: 0 },
		joinedAt: { type: Date, default: Date.now },
	},
	{ _id: false },
);

const groupChatJoinRequestSchema = new Schema<IGroupChatJoinRequest>(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
		requestedAt: { type: Date, default: Date.now },
		respondedAt: Date,
	},
	{ _id: false },
);

const groupChatChannelSchema = new Schema<IGroupChatChannel>(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, default: '', trim: true },
		type: { type: String, enum: ['Public', 'Private'], required: true },
		creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		members: { type: [groupChatMemberSchema], default: [] },
		joinRequests: { type: [groupChatJoinRequestSchema], default: [] },
		lastMessage: { type: String, default: '' },
		lastMessageAt: { type: Date, default: Date.now },
		isBlocked: { type: Boolean, default: false },
		isArchived: { type: Boolean, default: false },
	},
	{ timestamps: true },
);

groupChatChannelSchema.index({ name: 'text', description: 'text' });
groupChatChannelSchema.index({ creator: 1, isArchived: 1 });
groupChatChannelSchema.index({ 'members.user': 1, isArchived: 1 });
groupChatChannelSchema.index({ lastMessageAt: -1 });

export const GroupChatChannel = model<IGroupChatChannel>('GroupChatChannel', groupChatChannelSchema);
