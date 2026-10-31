'use client';

import { useTranslation } from 'react-i18next';

import { useCourseStudents } from '@/api/enrollment.api';
import { AppModal } from '@/components/common/AppModal';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { useCourseStudentColumns } from '@/components/enrollments/useCourseStudentColumns';

import type { TeacherCourse } from '@/schemas/teacher.schema';
import type { FC } from 'react';

interface CourseStudentsModalProps {
  /** The course whose students are shown; undefined while closed */
  course: TeacherCourse | undefined;
  open: boolean;
  onClose: () => void;
}

/** The enrolled students of one of the teacher's courses (names only: teachers never get emails). */
export const CourseStudentsModal: FC<CourseStudentsModalProps> = ({ course, open, onClose }) => {
  const { t } = useTranslation();
  const students = useCourseStudents(course?._id ?? '', open && course !== undefined);
  const columns = useCourseStudentColumns(false);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('teacher.studentsTitle', { title: course?.title ?? '' })}
      cancelLabel={t('common.close')}
      maxWidth="md"
    >
      <ResponsiveDataView
        rows={students.data ?? []}
        columns={columns}
        getRowId={(row) => row._id}
        label={t('teacher.studentsLabel')}
        isLoading={students.isPending}
        error={students.error}
        onRetry={() => void students.refetch()}
        emptyText={t('teacher.studentsEmpty')}
      />
    </AppModal>
  );
};
