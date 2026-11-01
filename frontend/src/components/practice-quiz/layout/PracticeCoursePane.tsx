'use client';

import { PracticeCourseList } from '../courses/PracticeCourseList';

import type { PracticePage } from '../usePracticePage';
import type { FC } from 'react';

interface PracticeCoursePaneProps {
  page: PracticePage;
  /** After a course was chosen (closes the drawer on phones) */
  onChosen: () => void;
}

/** The course list wired to the page state. */
export const PracticeCoursePane: FC<PracticeCoursePaneProps> = ({ page, onChosen }) => {
  const { courses, selection } = page;
  return (
    <PracticeCourseList
      courses={courses.data}
      isLoading={courses.isPending}
      error={courses.error}
      onRetry={() => void courses.refetch()}
      filters={page.filters}
      onFiltersChange={page.changeFilters}
      selectedCourseId={selection.courseId}
      onSelect={(courseId) => {
        selection.selectCourse(courseId);
        onChosen();
      }}
    />
  );
};
