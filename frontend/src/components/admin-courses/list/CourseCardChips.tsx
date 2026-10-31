'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { formatBdt, getCoursePriceInfo } from '@/utils/price';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

/** Purple of the "Subscription" chip (same as the old client). */
const SUBSCRIPTION_COLOR = '#7c3aed';

interface CourseCardChipsProps {
  course: AdminCourse;
  /** Moderator cards show the price next to the title instead */
  showPrice: boolean;
}

/** The current price as a short label ("Free" or "৳1,200"). */
export const usePriceLabel = (course: AdminCourse): string => {
  const { t } = useTranslation();
  const info = getCoursePriceInfo(course);
  return info.isFree ? t('adminCourses.values.Free') : formatBdt(info.discountPrice);
};

/** Price, category, visibility and subscription chips of a course card. */
export const CourseCardChips: FC<CourseCardChipsProps> = ({ course, showPrice }) => {
  const { t } = useTranslation();
  const priceLabel = usePriceLabel(course);
  const visibility = course.visibility === 'Private' ? 'Private' : 'Public';
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
      {showPrice && (
        <Chip
          label={priceLabel}
          size="small"
          color={course.pricing === 'Free' ? 'success' : 'default'}
          sx={{ fontWeight: 800 }}
        />
      )}
      {course.category?.name && (
        <Chip
          label={course.category.name}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      )}
      <Chip
        label={t(`adminCourses.values.${visibility}`)}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 700 }}
      />
      {course.includedInSubscription && (
        <Chip
          label={t('adminCourses.list.subscription')}
          size="small"
          sx={{ bgcolor: SUBSCRIPTION_COLOR, color: 'common.white', fontWeight: 800 }}
        />
      )}
    </Box>
  );
};
