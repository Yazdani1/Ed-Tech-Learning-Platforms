'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { InstructorCard } from './InstructorCard';

import type { TeacherRef } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseInstructorsProps {
  teachers: readonly (TeacherRef | null)[];
}

/** "Your Instructors": a card per teacher, two per row from tablet size. */
export const CourseInstructors: FC<CourseInstructorsProps> = ({ teachers }) => {
  const { t } = useTranslation();
  const list = teachers.flatMap((teacher) => (teacher ? [teacher] : []));
  if (list.length === 0) return null;
  return (
    <Box component="section" sx={{ mb: 4 }}>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {t('browse.detail.instructors')}
      </Typography>
      <Grid container spacing={2}>
        {list.map((teacher, index) => (
          <Grid key={teacher._id} size={{ xs: 12, sm: 6 }}>
            <InstructorCard teacher={teacher} index={index} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
