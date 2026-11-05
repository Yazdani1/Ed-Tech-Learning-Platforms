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

/** Soft blue across the whole screen width */
const INSTRUCTORS_BAND = '#e8f0fe';

/** "Instructors & Mentors": a wide card per teacher, two per row from tablet width, on a blue band. */
export const CourseInstructors: FC<CourseInstructorsProps> = ({ teachers }) => {
  const { t } = useTranslation();
  const list = teachers.flatMap((teacher) => (teacher ? [teacher] : []));
  if (list.length === 0) return null;
  return (
    <DetailSection
      id="course-instructors"
      title={t('browse.detail.instructors')}
      band={INSTRUCTORS_BAND}
    >
      <Box sx={gridSx(list.length > 1 ? 2 : 1, list.length > 1 ? 2 : 1)}>
        {list.map((teacher, index) => (
          <Box
            key={teacher._id}
            sx={{ maxWidth: list.length > 1 ? 'none' : 640, width: '100%', mx: 'auto' }}
          >
            <InstructorCard teacher={teacher} index={index} />
          </Box>
        ))}
      </Box>
    </DetailSection>
  );
};
