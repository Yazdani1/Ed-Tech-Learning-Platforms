import type { Course } from '@/schemas/browse.schema';
import type { Taxonomy } from '@/schemas/catalog.schema';

/** Id of the group of free courses without a course type. */
export const UNTYPED_GROUP_ID = 'uncategorized';

export interface FreeCourseGroup {
  id: string;
  /** null for the "other free courses" group (its title is translated by the page) */
  name: string | null;
  description: string | null;
  courses: Course[];
}

/** Free courses per course type (in the order of the type list); courses without a type come last. */
export const groupFreeCourses = (courses: Course[], types: Taxonomy[]): FreeCourseGroup[] => {
  const byType = new Map<string, Course[]>();
  const untyped: Course[] = [];
  courses.forEach((course) => {
    const typeId = course.courseType?._id;
    if (!typeId) {
      untyped.push(course);
      return;
    }
    byType.set(typeId, [...(byType.get(typeId) ?? []), course]);
  });
  const groups: FreeCourseGroup[] = types
    .map((type) => ({
      id: type._id,
      name: type.name,
      description: type.description ?? null,
      courses: byType.get(type._id) ?? [],
    }))
    .filter((group) => group.courses.length > 0);
  if (untyped.length > 0) {
    groups.push({ id: UNTYPED_GROUP_ID, name: null, description: null, courses: untyped });
  }
  return groups;
};
