import { Schema, model, type Document, type Types } from 'mongoose';

/** One visitor's view of a course page on one UTC day (so a visitor counts once a day). */
export interface ICourseView extends Document {
  course: Types.ObjectId;
  /** The signed-in user's id, or the anonymous visitor cookie */
  visitor: string;
  /** YYYY-MM-DD (UTC) */
  day: string;
  createdAt: Date;
}

const RETENTION_SECONDS = 2 * 24 * 60 * 60;

const courseViewSchema = new Schema<ICourseView>({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  visitor: { type: String, required: true },
  day: { type: String, required: true },
  // Only needed to stop repeats on the same day: removed after two days
  createdAt: { type: Date, default: Date.now, expires: RETENTION_SECONDS },
});

courseViewSchema.index({ course: 1, visitor: 1, day: 1 }, { unique: true });

export const CourseView = model<ICourseView>('CourseView', courseViewSchema);
