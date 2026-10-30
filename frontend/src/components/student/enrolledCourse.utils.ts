import type { EnrolledCourse } from '@/schemas/catalog.schema';

// Prices: utils/price.ts; image hosts: utils/urls.ts; SUBSCRIPTION_COLOR: components/course-card.

/** Course list filtered by a case-insensitive title search. */
export const filterByTitle = (courses: EnrolledCourse[], search: string): EnrolledCourse[] => {
  const term = search.trim().toLowerCase();
  return term ? courses.filter((course) => course.title.toLowerCase().includes(term)) : courses;
};

export const learnPath = (courseId: string): string =>
  `/student/courses/${encodeURIComponent(courseId)}/learn`;
