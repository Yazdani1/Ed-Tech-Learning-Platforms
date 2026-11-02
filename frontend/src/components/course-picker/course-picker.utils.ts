import type { TFunction } from 'i18next';

/** What the picker button says: "All courses", the one selected course's title, or "3 courses". */
export const courseSelectionLabel = (
  t: TFunction,
  courseIds: readonly string[],
  courses: readonly { _id: string; title: string }[] | undefined,
): string => {
  if (courseIds.length === 0) return t('coursePicker.allCourses');
  if (courseIds.length === 1) {
    const course = courses?.find((item) => item._id === courseIds[0]);
    if (course) return course.title;
  }
  return t('coursePicker.selectedCount', { count: courseIds.length });
};
