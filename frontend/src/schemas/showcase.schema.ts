import { z } from 'zod';

export const heroVisibilitySchema = z.enum(['Public', 'Private']);
export type HeroVisibility = z.infer<typeof heroVisibilitySchema>;

/** A homepage slider post as the admin list (GET /api/home-hero-posts) and the writes return it. */
export const heroPostSchema = z.object({
  _id: z.string(),
  imageUrl: z.string(),
  imageWidth: z.number().nullish(),
  imageHeight: z.number().nullish(),
  visibility: heroVisibilitySchema,
  scheduledVisibility: heroVisibilitySchema.nullish(),
  publishAt: z.string().nullish(),
  order: z.number(),
  createdAt: z.string(),
});
export type HeroPost = z.infer<typeof heroPostSchema>;

/** The single site logo (GET/PUT /api/home-hero-posts/logo); GET answers null before the first upload. */
export const siteLogoSchema = z.object({
  _id: z.string(),
  imageUrl: z.string(),
  imageWidth: z.number().nullish(),
  imageHeight: z.number().nullish(),
  updatedAt: z.string().optional(),
});
export type SiteLogo = z.infer<typeof siteLogoSchema>;

/** Upload/edit form fields (the image files are picked separately). publishAt is a datetime-local value. */
export const heroPostFormSchema = z.object({
  visibility: heroVisibilitySchema,
  publishAt: z.string(),
  order: z.string().trim().regex(/^\d*$/, 'showcase.form.orderInvalid'),
});
export type HeroPostForm = z.infer<typeof heroPostFormSchema>;

/** The image types and size the backend accepts (it checks the file content too). */
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
const BYTES_PER_MB = 1024 * 1024;
export const MAX_IMAGE_MB = 5;
export const MAX_IMAGE_BYTES = MAX_IMAGE_MB * BYTES_PER_MB;
/** The upload route takes at most 10 files at once. */
export const MAX_HERO_FILES = 10;
