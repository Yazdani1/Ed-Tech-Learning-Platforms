'use client';

import CardMembership from '@mui/icons-material/CardMembership';
import Verified from '@mui/icons-material/Verified';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { SUBSCRIPTION_COLOR } from '@/components/course-card/course-card';

import type { EnrolledCourse } from '@/schemas/catalog.schema';
import type { FC } from 'react';

const TYPE_BADGE_GRADIENT =
  'linear-gradient(90deg, #0f766e 0%, #7c3aed 40%, #0ea5e9 70%, #0f766e 100%)';
const WHITE_ICON = { '& .MuiChip-icon': { color: 'common.white' } };

interface CourseBadgesProps {
  course: EnrolledCourse;
}

/** Badges over the cover: "Subscription" (enrolled through a plan) and the course type. */
export const CourseBadges: FC<CourseBadgesProps> = ({ course }) => {
  const { t } = useTranslation();
  const viaSubscription = course.enrollmentType === 'subscription';
  if (!viaSubscription && !course.courseType) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 56,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.5,
      }}
    >
      {viaSubscription && (
        <Chip
          icon={<CardMembership />}
          label={t('student.subscriptionBadge')}
          size="small"
          sx={{
            bgcolor: SUBSCRIPTION_COLOR,
            color: 'common.white',
            fontWeight: 700,
            ...WHITE_ICON,
          }}
        />
      )}
      {course.courseType && (
        <Chip
          icon={<Verified />}
          label={course.courseType.name}
          size="small"
          sx={{
            background: TYPE_BADGE_GRADIENT,
            color: 'common.white',
            fontWeight: 800,
            textTransform: 'uppercase',
            ...WHITE_ICON,
          }}
        />
      )}
    </Box>
  );
};
