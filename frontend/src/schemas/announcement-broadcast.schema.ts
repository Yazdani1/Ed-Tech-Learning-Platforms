import { z } from 'zod';

import { postedBySchema } from './learn.schema';

// Announcements page: one announcement sent to several courses (GET/POST /api/announcements/broadcasts).

export const broadcastSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  image: z.object({ url: z.string() }).nullish(),
  postedBy: postedBySchema.nullish(),
  courseCount: z.number().catch(0),
  /** Distinct students who opened the announcements of one of its courses */
  seenCount: z.number().catch(0),
  createdAt: z.string(),
});
export type Broadcast = z.infer<typeof broadcastSchema>;

const broadcastCourseSchema = z.object({
  _id: z.string(),
  title: z.string().catch(''),
  coverImage: z.string().nullish(),
  batchNumber: z.string().nullish(),
  status: z.string().nullish(),
  studentCount: z.number().catch(0),
  seenCount: z.number().catch(0),
});
export type BroadcastCourse = z.infer<typeof broadcastCourseSchema>;

/** GET /api/announcements/broadcasts/:id */
export const broadcastDetailsSchema = broadcastSchema.extend({
  courses: z.array(broadcastCourseSchema).catch([]),
});
export type BroadcastDetails = z.infer<typeof broadcastDetailsSchema>;

/** The send form. Messages are i18n keys. */
export const broadcastFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(200, 'announcements.validation.titleLong'),
  description: z.string(),
  courseIds: z.array(z.string()).min(1, 'promos.validation.courses'),
});
export type BroadcastForm = z.infer<typeof broadcastFormSchema>;
