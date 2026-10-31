'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CourseCover } from '@/components/course-card/CourseCover';
import { formatBdt, getCoursePriceInfo } from '@/utils/price';

import type { Course } from '@/schemas/browse.schema';
import type { FC, ReactNode } from 'react';

interface EnrollmentCourseHeaderProps {
  course: Course | undefined;
  isLoading: boolean;
  /** Buttons on the right (CSV export) */
  actions?: ReactNode;
}

const THUMB_WIDTH = 88;
const THUMB_HEIGHT = 58;
const TITLE_SKELETON_WIDTH = '60%';

/** Cover, title, price and status of the course whose enrolments are shown. */
export const EnrollmentCourseHeader: FC<EnrollmentCourseHeaderProps> = ({
  course,
  isLoading,
  actions,
}) => {
  const { t } = useTranslation();
  const info = course ? getCoursePriceInfo(course) : null;
  const priceLabel = !info
    ? ''
    : info.isFree
      ? t('adminCourses.enrollments.freeCourse')
      : info.hasDiscount
        ? t('adminCourses.enrollments.priceWithDiscount', {
            price: formatBdt(info.discountPrice),
            percent: info.discountPercent,
          })
        : formatBdt(info.discountPrice);

  return (
    <Paper
      variant="outlined"
      sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, flexWrap: 'wrap' }}
    >
      <Box sx={{ width: THUMB_WIDTH, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
        <CourseCover
          src={course?.coverImage}
          alt=""
          height={THUMB_HEIGHT}
          sizes={`${THUMB_WIDTH}px`}
        />
      </Box>
      <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
        <Typography
          component="h1"
          variant="h5"
          sx={{ fontWeight: 900, lineHeight: 1.2, overflowWrap: 'anywhere' }}
        >
          {isLoading ? <Skeleton width={TITLE_SKELETON_WIDTH} /> : (course?.title ?? '—')}
        </Typography>
        {course && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
            <Chip label={priceLabel} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            <Chip
              label={t(
                `adminCourses.values.${course.status === 'Published' ? 'Published' : 'Draft'}`,
              )}
              size="small"
              color={course.status === 'Published' ? 'success' : 'default'}
              sx={{ fontWeight: 700 }}
            />
          </Box>
        )}
      </Box>
      {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
    </Paper>
  );
};
