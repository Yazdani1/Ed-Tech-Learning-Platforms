'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { InstructorCard } from '@/components/browse/detail/InstructorCard';

import { TabSection } from '../common/TabSection';

import type { Course, TeacherRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface TeachersTabProps {
  course: Course;
}

/** The course's instructors (photo, name, bio, expertise). */
export const TeachersTab: FC<TeachersTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const teachers = course.teachers.filter((teacher): teacher is TeacherRef => teacher !== null);
  return (
    <TabSection title={t('learn.teachers.title', { count: teachers.length })}>
      {teachers.length === 0 ? (
        <Typography color="text.secondary">{t('learn.teachers.empty')}</Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fill, minmax(260px, 1fr))' },
            gap: 3,
          }}
        >
          {teachers.map((teacher, index) => (
            <InstructorCard key={teacher._id} teacher={teacher} index={index} />
          ))}
        </Box>
      )}
    </TabSection>
  );
};
