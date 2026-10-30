'use client';

import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { IconTextList } from '../IconTextList';

import { SUBSCRIPTION_COLOR } from '@/components/course-card/course-card';
import { SuccessNotice } from './SuccessNotice';

import type { FC } from 'react';

interface SubscriptionPitchProps {
  plans: readonly string[];
  planCourseCounts: Record<string, number>;
  isSignedIn: boolean;
}

const ICON_SX = { fontSize: 15 } as const;

/** No running plan: the plans that include the course, and a link to the plans (or to sign-up for guests). */
export const SubscriptionPitch: FC<SubscriptionPitchProps> = ({
  plans,
  planCourseCounts,
  isSignedIn,
}) => {
  const { t } = useTranslation();
  const lines = [
    ...plans.map((plan) => {
      const count = planCourseCounts[plan] ?? 0;
      return {
        icon: <LocalOfferIcon sx={ICON_SX} />,
        text:
          count > 0
            ? t('browse.enroll.planLineCount', { plan, count })
            : t('browse.enroll.planLine', { plan }),
      };
    }),
    { icon: <AllInclusiveIcon sx={ICON_SX} />, text: t('browse.enroll.cancelAnytime') },
  ];
  return (
    <>
      <SuccessNotice>
        <Typography variant="caption" sx={{ color: '#166534' }}>
          {t('browse.enroll.freeWhenSubscribe')}
        </Typography>
      </SuccessNotice>
      <IconTextList items={lines} dense />
      <Button
        component={Link}
        href={isSignedIn ? '/pricing' : '/auth/register'}
        fullWidth
        variant="contained"
        size="large"
        sx={{ fontWeight: 700, borderRadius: 2, mt: 1.5, bgcolor: SUBSCRIPTION_COLOR }}
      >
        {isSignedIn ? t('browse.enroll.viewPlans') : t('browse.enroll.startSubscription')}
      </Button>
    </>
  );
};
