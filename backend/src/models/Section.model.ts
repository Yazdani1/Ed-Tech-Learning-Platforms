import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISection extends Document {
	course: Types.ObjectId;
	title: string;
	order: number;
	lectures: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}
const sectionSchema = new Schema<ISection>(
	{
		course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
		title: { type: String, required: true, trim: true },
		order: { type: Number, default: 0 },
		lectures: [{ type: Schema.Types.ObjectId, ref: 'Lecture' }],
	},
	{ timestamps: true },
);

export const Section = model<ISection>('Section', sectionSchema);
