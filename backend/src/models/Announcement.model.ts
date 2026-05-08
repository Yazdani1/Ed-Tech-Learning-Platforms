import { Schema, model, type Document, type Types } from 'mongoose';

export interface IAnnouncement extends Document {
  course: Types.ObjectId;
  title: string;
  description: string;
  postedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

announcementSchema.index({ course: 1, createdAt: -1 });

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
