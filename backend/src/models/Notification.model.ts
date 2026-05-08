import { model, Schema, type Document, type Types } from 'mongoose';
import type { UserRole } from '../types/index';

export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface INotificationRecipient {
	user: Types.ObjectId;
	readAt?: Date;
}

export interface INotification extends Document {
	title: string;
	message: string;
	priority: NotificationPriority;
	targetRoles: UserRole[];
	sentBy: Types.ObjectId;
	recipients: INotificationRecipient[];
	createdAt: Date;
	updatedAt: Date;
}

const notificationRecipientSchema = new Schema<INotificationRecipient>(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		readAt: Date,
	},
	{ _id: false },
);

const notificationSchema = new Schema<INotification>(
	{
		title: { type: String, required: true, trim: true, maxlength: 140 },
		message: { type: String, required: true, trim: true, maxlength: 2000 },
		priority: {
			type: String,
			enum: ['Low', 'Normal', 'High', 'Urgent'],
			default: 'Normal',
		},
		targetRoles: {
			type: [String],
			enum: ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'],
			required: true,
		},
		sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		recipients: { type: [notificationRecipientSchema], default: [] },
	},
	{ timestamps: true },
);

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ targetRoles: 1, createdAt: -1 });
notificationSchema.index({ 'recipients.user': 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
