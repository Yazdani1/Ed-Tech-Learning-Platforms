'use client';

import School from '@mui/icons-material/School';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl } from '@/utils/urls';

import type { TopCourse } from '@/schemas/insights.schema';
import type { FC } from 'react';

const COVER_SIZE = 48;

interface TopCourseRowProps {
  item: TopCourse;
  isFirst: boolean;
}

/** One top course: cover, title (or "Deleted course"), enrolment count and status. */
export const TopCourseRow: FC<TopCourseRowProps> = ({ item, isFirst }) => {
  const { t } = useTranslation();
  const { course } = item;
  const cover = course?.coverImage;
  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        borderTop: isFirst ? 0 : 1,
        borderColor: 'divider',
      }}
    >
      <Avatar
        src={isCloudinaryUrl(cover) ? cover : undefined}
        alt=""
        variant="rounded"
        sx={{ width: COVER_SIZE, height: COVER_SIZE, bgcolor: 'grey.200', color: 'grey.500' }}
      >
        <School />
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontWeight: 800 }}>
          {course?.title ?? t('insights.dashboard.deletedCourse')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('insights.dashboard.enrollmentCount', { count: item.enrollments })}
        </Typography>
      </Box>
      {course?.status && (
        <Chip
          size="small"
          variant="outlined"
          label={t(`insights.courseStatus.${course.status}`, { defaultValue: course.status })}
        />
      )}
    </Box>
  );
};
