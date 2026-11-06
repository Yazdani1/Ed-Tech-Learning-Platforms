'use client';

import { useTranslation } from 'react-i18next';

import { useStudentCourses } from '@/api/students.api';
import { CoursePickerDrawer } from '@/components/course-picker/CoursePickerDrawer';

import type { FC } from 'react';

interface RevenueCoursePickerProps {
  open: boolean;
  onClose: () => void;
  selectedIds: readonly string[];
  onApply: (ids: string[]) => void;
}

/** The left panel with every course (and its student count) to filter the orders by course. */
export const RevenueCoursePicker: FC<RevenueCoursePickerProps> = ({
  open,
  onClose,
  selectedIds,
  onApply,
}) => {
  const { t } = useTranslation();
  const courses = useStudentCourses();
  return (
    <CoursePickerDrawer
      open={open}
      onClose={onClose}
      title={t('coursePicker.title')}
      courses={{
        ...courses,
        data: courses.data?.map((course) => ({ ...course, count: course.enrolledStudents })),
      }}
      selectedIds={selectedIds}
      countLabel={(count) => t('coursePicker.students', { count })}
      onApply={onApply}
    />
  );
};
