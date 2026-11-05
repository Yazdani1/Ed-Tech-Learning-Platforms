'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { DetailSection, gridSx } from './extras/DetailSection';
import { InstructorCard } from './InstructorCard';

import type { TeacherRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseInstructorsProps {
  teachers: readonly (TeacherRef | null)[];
}

/** "Your Instructors": a card per teacher, two per row from tablet width and three on wide screens. */
export const CourseInstructors: FC<CourseInstructorsProps> = ({ teachers }) => {
  const { t } = useTranslation();
  const list = teachers.flatMap((teacher) => (teacher ? [teacher] : []));
  if (list.length === 0) return null;
  return (
    <DetailSection id="course-instructors" title={t('browse.detail.instructors')}>
      <Box sx={gridSx(2, 3)}>
        {list.map((teacher, index) => (
          <InstructorCard key={teacher._id} teacher={teacher} index={index} />
        ))}
      </Box>
    </DetailSection>
  );
};
