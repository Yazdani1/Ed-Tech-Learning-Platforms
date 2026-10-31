'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import { usePriceLabel } from './CourseCardChips';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface CourseCardHeadingProps {
  course: AdminCourse;
  /** Managers see the status chip; Moderators (published courses only) see the price */
  showStatus: boolean;
}

const CLAMP_2 = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;

/** Title (links to the course details), subtitle and the status or price chip. */
export const CourseCardHeading: FC<CourseCardHeadingProps> = ({ course, showStatus }) => {
  const { t } = useTranslation();
  const priceLabel = usePriceLabel(course);
  const published = course.status === 'Published';
  const date = course.publishedAt ?? course.updatedAt;
  const statusLabel = published
    ? t('adminCourses.list.publishedOn', {
        date: date ? formatDate(date) : t('adminCourses.list.dateUnavailable'),
      })
    : t('adminCourses.values.Draft');

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 1.5,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 180px' }}>
        <Typography
          component="h2"
          variant="h6"
          sx={{ fontWeight: 900, lineHeight: 1.25, overflowWrap: 'anywhere', ...CLAMP_2 }}
        >
          <Box
            component={Link}
            href={`/admin/courses/${course._id}`}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {course.title}
          </Box>
        </Typography>
        {course.subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, ...CLAMP_2 }}>
            {course.subtitle}
          </Typography>
        )}
      </Box>
      <Chip
        label={showStatus ? statusLabel : priceLabel}
        size="small"
        color={(showStatus ? published : course.pricing === 'Free') ? 'success' : 'default'}
        sx={{ fontWeight: 800, flexShrink: 0 }}
      />
    </Box>
  );
};
