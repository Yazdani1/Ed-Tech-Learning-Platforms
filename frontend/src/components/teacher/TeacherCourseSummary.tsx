'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { htmlToPlainText } from '@/utils/html-text';

import type { TeacherCourse } from '@/schemas/teacher.schema';
import type { FC } from 'react';

const TITLE_LINES = 2;
const DESCRIPTION_LINES = 3;

const clamp = (lines: number) =>
  ({
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }) as const;

interface TeacherCourseSummaryProps {
  course: TeacherCourse;
}

/** Title, subtitle, status, course type / category / visibility chips and a short description. */
export const TeacherCourseSummary: FC<TeacherCourseSummaryProps> = ({ course }) => {
  const { t } = useTranslation();
  const description = htmlToPlainText(course.description);
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ fontWeight: 900, lineHeight: 1.25, ...clamp(TITLE_LINES) }}
          >
            {course.title}
          </Typography>
          {course.subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.75, ...clamp(TITLE_LINES) }}
            >
              {course.subtitle}
            </Typography>
          )}
        </Box>
        <Chip
          label={t(`teacher.status.${course.status}`)}
          size="small"
          color={course.status === 'Published' ? 'success' : 'default'}
          variant="outlined"
          sx={{ fontWeight: 800, flexShrink: 0 }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
        {course.courseType && (
          <Chip label={course.courseType.name} size="small" variant="outlined" />
        )}
        {course.category && <Chip label={course.category.name} size="small" variant="outlined" />}
        <Chip label={t(`teacher.visibility.${course.visibility}`)} size="small" />
      </Box>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, lineHeight: 1.7, ...clamp(DESCRIPTION_LINES) }}
        >
          {description}
        </Typography>
      )}
    </>
  );
};
