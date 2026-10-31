import { z } from 'zod';

// Shapes of the public-site endpoints (home, teachers, pricing, site chrome), as the backend sends them.
// Only the fields the pages use; unknown fields are dropped. Categories, course types, plans and
// subscriptions are in catalog.schema.ts (shared with the other screens).

/** GET /api/home-hero-posts/public: one slider image. */
export const heroPostSchema = z.object({
  _id: z.string(),
  imageUrl: z.string(),
  imageWidth: z.number().nullish(),
  imageHeight: z.number().nullish(),
  order: z.number().optional(),
});
export type HeroPost = z.infer<typeof heroPostSchema>;

/** GET /api/home-hero-posts/logo/public: the site logo, or null when none was uploaded. */
export const siteLogoSchema = z
  .object({
    _id: z.string(),
    imageUrl: z.string(),
    updatedAt: z.string().optional(),
  })
  .nullable();
export type SiteLogo = z.infer<typeof siteLogoSchema>;

/** GET /api/courses/discounts/active: summary of running course discounts, or null. */
export const activeDiscountSchema = z
  .object({
    courseCount: z.number(),
    discountPercent: z.number(),
    discountEndsAt: z.string(),
  })
  .nullable();
export type ActiveDiscount = z.infer<typeof activeDiscountSchema>;

/** GET /api/teachers items (public teacher profiles). */
export const teacherProfileSchema = z.object({
  _id: z.string(),
  name: z.string(),
  bio: z.string().catch(''),
  profileImage: z.string().nullish(),
  expertise: z.array(z.string()).catch([]),
  socialLinks: z
    .object({
      website: z.string().nullish(),
      linkedin: z.string().nullish(),
      twitter: z.string().nullish(),
      youtube: z.string().nullish(),
    })
    .nullish(),
});
export type TeacherProfile = z.infer<typeof teacherProfileSchema>;

/** The same items as Super Admin / Admin get them: also the linked login account id and the creation date. */
export const adminTeacherSchema = teacherProfileSchema.extend({
  userId: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type AdminTeacher = z.infer<typeof adminTeacherSchema>;

const namedRefSchema = z.object({ _id: z.string(), name: z.string() });

/** A course in GET /api/courses/browse (the fields a course card shows). */
export const courseCardSchema = z.object({
  _id: z.string(),
  title: z.string(),
  coverImage: z.string().nullish(),
  pricing: z.enum(['Free', 'Paid']),
  price: z.number().nullish(),
  listPrice: z.number().nullish(),
  discountPrice: z.number().nullish(),
  discountEndsAt: z.string().nullish(),
  category: namedRefSchema.nullish(),
  courseType: namedRefSchema.nullish(),
  /** A deleted teacher comes back as null: dropped here, so cards only list real names */
  teachers: z
    .array(namedRefSchema.nullable())
    .catch([])
    .transform((teachers) => teachers.filter((teacher) => teacher !== null)),
});
export type CourseCardData = z.infer<typeof courseCardSchema>;

/** GET /api/courses/browse?page&limit: the whole envelope (it carries `pagination`). */
export const coursePageSchema = z.object({
  data: z.array(courseCardSchema),
  total: z.number().optional(),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});
export type CoursePage = z.infer<typeof coursePageSchema>;

/** Filters of the "included courses" dialog on /pricing. */
export interface PlanCourseFilters {
  search: string;
  category: string;
  courseType: string;
  pricing: '' | 'Free' | 'Paid';
}
