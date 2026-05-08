import { Schema, model, type Document, type Types } from 'mongoose';

export interface IStudyCurriculumLecture {
	title: string;
	description?: string;
	day: string;
	time: string;
}

export interface IStudyCurriculum extends Document {
	course: Types.ObjectId;
	title: string;
	description: string;
	weekName: string;
	lectures: IStudyCurriculumLecture[];
	postedBy: Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const studyCurriculumLectureSchema = new Schema<IStudyCurriculumLecture>(
	{
		title: { type: String, required: true, trim: true },
		description: { type: String, default: '' },
		day: { type: String, required: true, trim: true },
		time: { type: String, required: true, trim: true },
	},
	{ _id: true },
);

const studyCurriculumSchema = new Schema<IStudyCurriculum>(
	{
		course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
		title: { type: String, required: true, trim: true },
		description: { type: String, required: true },
		weekName: { type: String, required: true, trim: true },
		lectures: [studyCurriculumLectureSchema],
		postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true },
);

studyCurriculumSchema.index({ course: 1, createdAt: 1 });

export const StudyCurriculum = model<IStudyCurriculum>(
	'StudyCurriculum',
	studyCurriculumSchema,
);
