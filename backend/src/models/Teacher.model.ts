import { Schema, model, type Document } from 'mongoose';

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
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, required: true },
    profileImage: String,
    profileImagePublicId: String,
    expertise: [{ type: String, trim: true }],
    socialLinks: {
      website: String,
      linkedin: String,
      twitter: String,
      youtube: String,
    },
  },
  { timestamps: true }
);

export const Teacher = model<ITeacher>('Teacher', teacherSchema);
