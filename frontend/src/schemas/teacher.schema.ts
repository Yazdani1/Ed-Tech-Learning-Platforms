import { z } from 'zod';

// Shapes of the teacher area's reads, matching what the backend really sends.

const namedRefSchema = z.object({ _id: z.string(), name: z.string() });

/**
 * One item of GET /api/teachers/my-courses (signed-in Teacher): the whole course with category, course type
 * and teachers populated. A deleted category/type/teacher comes back as null.
 */
export const teacherCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  subtitle: z.string().nullish(),
  /** Rich text (HTML from the editor) */
  description: z.string().nullish(),
  coverImage: z.string().nullish(),
  /** An unexpected value shows as Draft / Private instead of failing the whole list */
  status: z.enum(['Draft', 'Published']).catch('Draft'),
  visibility: z.enum(['Public', 'Private']).catch('Private'),
  category: namedRefSchema.nullish(),
  courseType: namedRefSchema.nullish(),
  teachers: z.array(namedRefSchema.nullable()).catch([]),
});
export type TeacherCourse = z.infer<typeof teacherCourseSchema>;
