'use client';

import PublicIcon from '@mui/icons-material/Public';
import PublicOffIcon from '@mui/icons-material/PublicOff';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { COURSE_STATUS_COLOR, courseStatusLabel } from '@/utils/course-status';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseStatusHeadingProps {
  course: Course;
}

const TITLE_KEYS = {
  Published: 'catalog.settings.publishedTitle',
  Archived: 'catalog.settings.archivedTitle',
  Draft: 'catalog.settings.draftTitle',
} as const;

/** "This course is published / archived / a draft" with its status chip. */
export const CourseStatusHeading: FC<CourseStatusHeadingProps> = ({ course }) => {
  const { t } = useTranslation();
  const status = courseStatusLabel(course);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {status === 'Published' ? <PublicIcon color="success" /> : <PublicOffIcon color="disabled" />}
      <Typography component="h3" sx={{ fontWeight: 700 }}>
        {t(TITLE_KEYS[status])}
      </Typography>
      <Chip
        size="small"
        label={t(`adminCourses.values.${status}`)}
        color={COURSE_STATUS_COLOR[status]}
        sx={{ fontWeight: 700 }}
      />
    </Box>
  );
};
