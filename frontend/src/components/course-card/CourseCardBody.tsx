'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CoursePrice } from './CoursePrice';

import type { CardCourse } from './course-card';
import type { FC, ReactNode } from 'react';

interface CourseCardBodyProps {
  course: CardCourse;
  /** Small line above the title (e.g. the course type) */
  eyebrow?: ReactNode;
}

const TITLE_SX = {
  fontWeight: 800,
  fontSize: '0.95rem',
  lineHeight: 1.35,
  overflowWrap: 'anywhere',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;
const FOOTER_SX = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 1,
  mt: 0.5,
} as const;

/** Text of a course card: title (two lines at most), teachers, then price and category at the bottom. */
export const CourseCardBody: FC<CourseCardBodyProps> = ({ course, eyebrow }) => {
  const { t } = useTranslation();
  const teachers = course.teachers.flatMap((teacher) => (teacher ? [teacher.name] : [])).join(', ');
  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 0.5 }}>
      {eyebrow}
      <Typography component="h3" sx={TITLE_SX}>
        {course.title}
      </Typography>
      {teachers && (
        <Typography variant="caption" color="text.secondary">
          {teachers}
        </Typography>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={FOOTER_SX}>
        <CoursePrice course={course} />
        <Chip
          label={course.category?.name ?? t('common.course')}
          size="small"
          variant="outlined"
          sx={{ maxWidth: 140, fontWeight: 700 }}
        />
      </Box>
    </Box>
  );
};
