import { Schema, model, type Document, type Types } from 'mongoose';

/**
 * One announcement sent to several courses at once (Announcements page). Each course gets its own
 * Announcement (linked by `broadcast`), so it shows in that course's announcements.
 */
export interface IAnnouncementBroadcast extends Document {
  title: string;
  description: string;
  image?: { url: string; publicId: string };
  courses: Types.ObjectId[];
  postedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const broadcastSchema = new Schema<IAnnouncementBroadcast>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { url: String, publicId: { type: String, select: false } },
    courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

broadcastSchema.index({ createdAt: -1 });

export const AnnouncementBroadcast = model<IAnnouncementBroadcast>('AnnouncementBroadcast', broadcastSchema);
