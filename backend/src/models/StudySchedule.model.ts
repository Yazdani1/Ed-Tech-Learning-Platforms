import { Schema, model, type Document, type Types } from 'mongoose';

export type ScheduleType = 'timer' | 'reminder';
export type ScheduleStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface IStudySchedule extends Document {
	user: Types.ObjectId;
	type: ScheduleType;
	title: string;
	description: string;
	status: ScheduleStatus;
	duration?: number;
	elapsedSeconds?: number;
	completedAt?: Date;
	startDateTime?: Date;
	endDateTime?: Date;
	firedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const studyScheduleSchema = new Schema<IStudySchedule>(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		type: { type: String, enum: ['timer', 'reminder'], required: true },
		title: { type: String, required: true, trim: true, maxlength: 200 },
		description: { type: String, default: '', trim: true },
		status: {
			type: String,
			enum: ['pending', 'active', 'paused', 'completed', 'cancelled'],
			default: 'active',
		},
		duration: { type: Number, min: 0 },
		elapsedSeconds: { type: Number, default: 0 },
		completedAt: { type: Date },
		startDateTime: { type: Date },
		endDateTime: { type: Date },
		firedAt: { type: Date },
	},
	{ timestamps: true },
);

studyScheduleSchema.index({ user: 1, type: 1, status: 1, createdAt: -1 });

export const StudySchedule = model<IStudySchedule>('StudySchedule', studyScheduleSchema);
