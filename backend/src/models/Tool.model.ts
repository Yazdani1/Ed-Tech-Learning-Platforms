import { Schema, model, type Document, type Types } from 'mongoose';

/** A tool or technology taught in courses (e.g. Node.js), with its logo. */
export interface ITool extends Document {
	name: string;
	logoUrl: string;
	logoPublicId: string;
	createdBy: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const toolSchema = new Schema<ITool>(
	{
		name: { type: String, required: true, trim: true, maxlength: 60 },
		logoUrl: { type: String, required: true },
		logoPublicId: { type: String, required: true, select: false },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true },
);

toolSchema.index({ name: 1 });

export const Tool = model<ITool>('Tool', toolSchema);
