'use client';

import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CoursePickerOption } from './CoursePickerOption';

import type { PickerCourse } from './course-picker.types';
import type { FC } from 'react';

interface CoursePickerListProps {
  courses: readonly PickerCourse[];
  search: string;
  /** Ticked course ids; empty = "All courses" */
  selectedIds: readonly string[];
  countLabel: (count: number) => string;
  onToggle: (courseId: string) => void;
  onSelectAll: () => void;
}

/** "All courses" first, then the courses matching the search (title). */
export const CoursePickerList: FC<CoursePickerListProps> = ({
  courses,
  search,
  selectedIds,
  countLabel,
  onToggle,
  onSelectAll,
}) => {
  const { t } = useTranslation();
  const needle = search.trim().toLowerCase();
  const matching = courses.filter((course) => course.title.toLowerCase().includes(needle));
  return (
    <>
      <List aria-label={t('coursePicker.courseList')} disablePadding>
        <CoursePickerOption
          title={t('coursePicker.allCourses')}
          checked={selectedIds.length === 0}
          showCover={false}
          onToggle={onSelectAll}
        />
        {matching.map((course) => (
          <CoursePickerOption
            key={course._id}
            title={course.title}
            coverImage={course.coverImage}
            checked={selectedIds.includes(course._id)}
            draft={course.status === 'Draft'}
            countLabel={countLabel(course.count)}
            onToggle={() => {
              onToggle(course._id);
            }}
          />
        ))}
      </List>
      {needle !== '' && matching.length === 0 && (
        <Typography color="text.secondary" sx={{ my: 1.5 }}>
          {t('coursePicker.noMatch')}
        </Typography>
      )}
    </>
  );
};
