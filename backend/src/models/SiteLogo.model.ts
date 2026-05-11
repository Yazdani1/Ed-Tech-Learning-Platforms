import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISiteLogo extends Document {
	imageUrl: string;
	imagePublicId: string;
	imageWidth?: number;
	imageHeight?: number;
	updatedBy: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const siteLogoSchema = new Schema<ISiteLogo>(
	{
		imageUrl: { type: String, required: true },
		imagePublicId: { type: String, required: true },
		imageWidth: Number,
		imageHeight: Number,
		updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true },
);

export const SiteLogo = model<ISiteLogo>('SiteLogo', siteLogoSchema);
