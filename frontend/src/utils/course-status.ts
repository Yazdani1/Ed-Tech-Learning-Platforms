export type CourseStatusLabel = 'Published' | 'Archived' | 'Draft';

/** "Archived" = published once and then unpublished (it can never be deleted); "Draft" = never published. */
export const courseStatusLabel = (course: {
  status?: string | null;
  firstPublishedAt?: string | null;
}): CourseStatusLabel => {
  if (course.status === 'Published') return 'Published';
  return course.firstPublishedAt ? 'Archived' : 'Draft';
};

export const COURSE_STATUS_COLOR: Record<CourseStatusLabel, 'success' | 'warning' | 'default'> = {
  Published: 'success',
  Archived: 'warning',
  Draft: 'default',
};
