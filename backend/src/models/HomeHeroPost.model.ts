import { Schema, model, type Document, type Types } from 'mongoose';

export type HomeHeroPostVisibility = 'Public' | 'Private';

export interface IHomeHeroPost extends Document {
	imageUrl: string;
	imagePublicId: string;
	imageWidth?: number;
	imageHeight?: number;
	visibility: HomeHeroPostVisibility;
	scheduledVisibility?: HomeHeroPostVisibility;
	publishAt?: Date;
	order: number;
	createdBy: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const homeHeroPostSchema = new Schema<IHomeHeroPost>(
	{
		imageUrl: { type: String, required: true },
		imagePublicId: { type: String, required: true },
		imageWidth: Number,
		imageHeight: Number,
		visibility: { type: String, enum: ['Public', 'Private'], default: 'Private', index: true },
		scheduledVisibility: { type: String, enum: ['Public', 'Private'], index: true },
		publishAt: { type: Date, index: true },
		order: { type: Number, default: 0, index: true },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true },
);

homeHeroPostSchema.index({ visibility: 1, scheduledVisibility: 1, publishAt: 1, order: 1 });

export const HomeHeroPost = model<IHomeHeroPost>('HomeHeroPost', homeHeroPostSchema);
