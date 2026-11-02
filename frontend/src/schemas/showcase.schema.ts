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
  title: z.string().nullish(),
  description: z.string().nullish(),
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
export const HERO_TITLE_MAX = 120;
export const HERO_DESCRIPTION_MAX = 300;

export const heroPostFormSchema = z.object({
  title: z.string().trim().max(HERO_TITLE_MAX, 'showcase.form.titleTooLong'),
  description: z.string().trim().max(HERO_DESCRIPTION_MAX, 'showcase.form.descriptionTooLong'),
  visibility: heroVisibilitySchema,
  publishAt: z.string(),
  order: z.string().trim().regex(/^\d*$/, 'showcase.form.orderInvalid'),
});
export type HeroPostForm = z.infer<typeof heroPostFormSchema>;
