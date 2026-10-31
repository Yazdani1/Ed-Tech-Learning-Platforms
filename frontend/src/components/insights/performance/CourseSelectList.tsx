'use client';

import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ALL_COURSES } from '@/api/insights.api';

import { CourseSelectOption } from './CourseSelectOption';

import type { PerformanceCourse } from '@/schemas/insights.schema';
import type { FC } from 'react';

interface CourseSelectListProps {
  /** Courses matching the search */
  courses: PerformanceCourse[];
  /** True when the search box has text (shows "no match" for an empty result) */
  isSearching: boolean;
  selectedId: string;
  onChoose: (courseId: string) => void;
}

/** "All courses" first, then the matching courses. */
export const CourseSelectList: FC<CourseSelectListProps> = ({
  courses,
  isSearching,
  selectedId,
  onChoose,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <List aria-label={t('insights.performance.courseList')} disablePadding>
        <CourseSelectOption
          title={t('insights.performance.allCourses')}
          selected={selectedId === ALL_COURSES}
          onSelect={() => {
            onChoose(ALL_COURSES);
          }}
        />
        {courses.map((course) => (
          <CourseSelectOption
            key={course._id}
            title={course.title}
            selected={selectedId === course._id}
            draft={course.status === 'Draft'}
            onSelect={() => {
              onChoose(course._id);
            }}
          />
        ))}
      </List>
      {isSearching && courses.length === 0 && (
        <Typography color="text.secondary" sx={{ my: 1.5 }}>
          {t('insights.performance.noCourseMatch')}
        </Typography>
      )}
    </>
  );
};
