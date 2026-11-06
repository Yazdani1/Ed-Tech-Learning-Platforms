import { Schema, model, type Document, type Types } from 'mongoose';

/** A student saw an announcement (its course's announcements list was opened); one row per student. */
export interface IAnnouncementView extends Document {
  announcement: Types.ObjectId;
  /** Set when the announcement came from a multi-course broadcast (its "seen by" count) */
  broadcast?: Types.ObjectId;
  student: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementViewSchema = new Schema<IAnnouncementView>(
  {
    announcement: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
    broadcast: { type: Schema.Types.ObjectId, ref: 'AnnouncementBroadcast' },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

announcementViewSchema.index({ announcement: 1, student: 1 }, { unique: true });
announcementViewSchema.index({ broadcast: 1, student: 1 });

export const AnnouncementView = model<IAnnouncementView>('AnnouncementView', announcementViewSchema);
