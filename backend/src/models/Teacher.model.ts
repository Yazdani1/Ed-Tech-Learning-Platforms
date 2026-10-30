import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISocialLinks {
  website?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

export interface ITeacher extends Document {
  name: string;
  bio: string;
  profileImage?: string;
  profileImagePublicId?: string;
  expertise: string[];
  socialLinks?: ISocialLinks;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, required: true },
    profileImage: String,
    profileImagePublicId: { type: String, select: false },
    expertise: [{ type: String, trim: true }],
    socialLinks: {
      website: String,
      linkedin: String,
      twitter: String,
      youtube: String,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, unique: true },
  },
  { timestamps: true }
);

export const Teacher = model<ITeacher>('Teacher', teacherSchema);
