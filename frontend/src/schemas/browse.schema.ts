import { z } from 'zod';

// Public catalog shapes: what GET /api/courses/browse, GET /api/courses/:id and the other public reads really
// send (only the fields the catalog uses; unknown fields are dropped). A populated reference whose document was
// deleted comes back as null, so references are nullish.

export const coursePricingSchema = z.enum(['Free', 'Paid']);
export type CoursePricing = z.infer<typeof coursePricingSchema>;

export const categoryRefSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
});
export type CategoryRef = z.infer<typeof categoryRefSchema>;

export const courseTypeRefSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
});
export type CourseTypeRef = z.infer<typeof courseTypeRefSchema>;

export const teacherRefSchema = z.object({
  _id: z.string(),
  name: z.string(),
  profileImage: z.string().nullish(),
  bio: z.string().nullish(),
  expertise: z.array(z.string()).default([]),
});
export type TeacherRef = z.infer<typeof teacherRefSchema>;

/** A lecture of the course outline. `videoUrl` is only sent for free previews (or to viewers with access). */
export const courseLectureSchema = z.object({
  _id: z.string(),
  title: z.string(),
  videoUrl: z.string().nullish(),
  isPreview: z.boolean().default(false),
  /** Seconds */
  duration: z.number().nullish(),
});
export type CourseLecture = z.infer<typeof courseLectureSchema>;

export const courseSectionSchema = z.object({
  _id: z.string(),
  /** The catalog list leaves the title out (only the detail page needs it) */
  title: z.string().default(''),
  lectures: z.array(courseLectureSchema).default([]),
});
export type CourseSection = z.infer<typeof courseSectionSchema>;

export const courseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  subtitle: z.string().nullish(),
  description: z.string().default(''),
  coverImage: z.string().nullish(),
  category: categoryRefSchema.nullish(),
  courseType: courseTypeRefSchema.nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
  teachers: z.array(teacherRefSchema.nullable()).default([]),
  status: z.string().default('Published'),
  pricing: coursePricingSchema,
  price: z.number().nullish(),
  listPrice: z.number().nullish(),
  discountPrice: z.number().nullish(),
  discountEndsAt: z.string().nullish(),
  includedInSubscription: z.boolean().default(false),
  allowedSubscriptionPlans: z.array(z.string()).default([]),
  whatYouWillLearn: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  sections: z.array(courseSectionSchema.nullable()).default([]),
});
export type Course = z.infer<typeof courseSchema>;

const countMapSchema = z.record(z.string(), z.number()).default({});

/** Number of public courses per filter value (ignores the other filters, like the old sidebar). */
export const filterCountsSchema = z.object({
  courseTypes: countMapSchema,
  categories: countMapSchema,
  pricing: countMapSchema,
  subscriptionPlans: countMapSchema,
});
export type FilterCounts = z.infer<typeof filterCountsSchema>;

/** GET /api/courses/browse envelope (with page/limit it adds `pagination`). */
export const browseEnvelopeSchema = z.object({
  data: z.array(courseSchema),
  total: z.number(),
  filterCounts: filterCountsSchema,
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
});
export type BrowseResult = z.infer<typeof browseEnvelopeSchema>;

/** GET /api/study-curricula/course/:id items (public fields: guests get no poster or links). */
export const liveClassWeekSchema = z.object({
  _id: z.string(),
  title: z.string().nullish(),
  weekName: z.string().nullish(),
  description: z.string().default(''),
  lectures: z
    .array(
      z.object({
        _id: z.string().optional(),
        title: z.string(),
        description: z.string().nullish(),
        day: z.string(),
        time: z.string(),
      }),
    )
    .default([]),
});
export type LiveClassWeek = z.infer<typeof liveClassWeekSchema>;

/** GET /api/quiz-bank/public/course/:id: the free-preview quiz sections (no questions are used here). */
export const publicQuizTreeSchema = z.object({
  sections: z
    .array(
      z.object({
        _id: z.string(),
        title: z.string(),
        isFreePreview: z.boolean().default(false),
        banks: z
          .array(
            z.object({
              _id: z.string(),
              title: z.string(),
              isFreePreview: z.boolean().default(false),
            }),
          )
          .default([]),
      }),
    )
    .default([]),
});
export type PublicQuizSection = z.infer<typeof publicQuizTreeSchema>['sections'][number];

/** GET /api/enrollments/:courseId/check */
export const enrollmentCheckSchema = z.object({
  isEnrolled: z.boolean(),
  enrolledAt: z.string().nullish(),
});
export type EnrollmentCheck = z.infer<typeof enrollmentCheckSchema>;
