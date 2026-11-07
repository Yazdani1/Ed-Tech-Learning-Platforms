import { Schema, model, type Document, type Types } from 'mongoose';

export interface IAnnouncement extends Document {
  course: Types.ObjectId;
  title: string;
  description: string;
  postedBy: Types.ObjectId;
  /** Set when it was sent to several courses from the Announcements page */
  broadcast?: Types.ObjectId;
  image?: { url: string };
  /** Deleted from the Announcements page: hidden everywhere, kept in the database */
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    broadcast: { type: Schema.Types.ObjectId, ref: 'AnnouncementBroadcast', index: true },
    image: { url: String },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

announcementSchema.index({ course: 1, createdAt: -1 });

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
