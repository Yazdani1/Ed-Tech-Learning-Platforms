'use client';

import { useTranslation } from 'react-i18next';

import { CoursePickerDrawer } from '@/components/course-picker/CoursePickerDrawer';

import type { StudentCourse } from '@/schemas/students.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

interface StudentCoursePickerProps {
  open: boolean;
  onClose: () => void;
  courses: UseQueryResult<StudentCourse[], ApiError>;
  selectedIds: readonly string[];
  onApply: (ids: string[]) => void;
}

/** The left course list of the students page (with each course's student count); several can be chosen. */
export const StudentCoursePicker: FC<StudentCoursePickerProps> = ({
  open,
  onClose,
  courses,
  selectedIds,
  onApply,
}) => {
  const { t } = useTranslation();
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
