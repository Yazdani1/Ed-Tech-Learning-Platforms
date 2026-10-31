'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useMyTeacherCourses } from '@/api/teacher.api';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { CourseStudentsModal } from './CourseStudentsModal';
import { TeacherCourseCard } from './TeacherCourseCard';

import type { TeacherCourse } from '@/schemas/teacher.schema';

/** /teacher/courses: the courses the signed-in teacher is assigned to, with their enrolled students. */
export const TeacherCoursesPage = () => {
  const { t } = useTranslation();
  const courses = useMyTeacherCourses();
  const studentsModal = useModal<TeacherCourse>();

  return (
    <Box>
      <PageHeader title={t('teacher.title')} subtitle={t('teacher.subtitle')} />
      <QueryState
        isLoading={courses.isPending}
        error={courses.error}
        isEmpty={courses.data?.length === 0}
        onRetry={() => void courses.refetch()}
        emptyText={t('teacher.empty')}
      >
        <Box
          component="section"
          aria-label={t('teacher.listLabel')}
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {courses.data?.map((course) => (
            <TeacherCourseCard
              key={course._id}
              course={course}
              onShowStudents={studentsModal.openModal}
            />
          ))}
        </Box>
      </QueryState>
      <CourseStudentsModal
        course={studentsModal.data}
        open={studentsModal.open}
        onClose={studentsModal.closeModal}
      />
    </Box>
  );
};
