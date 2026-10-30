'use client';

import CardMembershipIcon from '@mui/icons-material/CardMembership';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SUBSCRIPTION_COLOR } from '@/components/course-card/course-card';
import { formatDate } from '@/utils/dateTime';

import { SuccessNotice } from './SuccessNotice';

import type { FC } from 'react';

interface SubscriptionCoveredProps {
  plan: string;
  endDate: string;
  planCourseCount: number;
  enrolling: boolean;
  onEnroll: () => void;
}

const BUTTON_SX = {
  fontWeight: 700,
  borderRadius: 2,
  mt: 0.5,
  bgcolor: SUBSCRIPTION_COLOR,
  '&:hover': { bgcolor: '#6d28d9' },
} as const;

/** The student's running plan includes the course: "Enroll with Subscription". */
export const SubscriptionCovered: FC<SubscriptionCoveredProps> = ({
  plan,
  endDate,
  planCourseCount,
  enrolling,
  onEnroll,
}) => {
  const { t, i18n } = useTranslation();
  const details = [
    t('browse.enroll.planExpires', { plan, date: formatDate(endDate, i18n.language) }),
    ...(planCourseCount > 0 ? [t('browse.enroll.planCourses', { count: planCourseCount })] : []),
  ].join(' · ');
  return (
    <>
      <SuccessNotice>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', display: 'block' }}>
          {t('browse.enroll.freeWithSub')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'grey.700' }}>
          {details}
        </Typography>
      </SuccessNotice>
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={enrolling}
        onClick={onEnroll}
        startIcon={<CardMembershipIcon />}
        sx={BUTTON_SX}
      >
        {enrolling ? (
          <CircularProgress size={22} color="inherit" aria-label={t('common.loading')} />
        ) : (
          t('browse.enroll.enrollWithSub')
        )}
      </Button>
    </>
  );
};
