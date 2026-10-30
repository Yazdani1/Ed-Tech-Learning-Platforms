import { z } from 'zod';

// The enrolled-course shape (GET /api/enrollments) is shared: see catalog.schema.ts.

/** /student/courses query string: the search box. */
export const myCoursesParamsSchema = z.object({ search: z.string().catch('') });
