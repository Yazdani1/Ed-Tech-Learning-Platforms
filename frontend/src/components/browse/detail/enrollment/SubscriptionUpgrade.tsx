'use client';

import CardMembershipIcon from '@mui/icons-material/CardMembership';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { PlanRow } from './PlanRow';

import type { FC } from 'react';

interface SubscriptionUpgradeProps {
  currentPlan: string;
  requiredPlans: readonly string[];
  planCourseCounts: Record<string, number>;
}

const UPGRADE_BUTTON_SX = {
  fontWeight: 600,
  borderRadius: 2,
  minHeight: 44,
  color: '#92400e',
  borderColor: '#f97316',
} as const;

/** The student's running plan does not include the course: show the plans that do and an upgrade link. */
export const SubscriptionUpgrade: FC<SubscriptionUpgradeProps> = ({
  currentPlan,
  requiredPlans,
  planCourseCounts,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Box
        sx={{ bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1.5, p: 1.5, mb: 2 }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, color: '#92400e', display: 'block', mb: 1 }}
        >
          {t('browse.enroll.upgradeRequired')}
        </Typography>
        <PlanRow label={t('browse.enroll.currentPlan')} plans={[currentPlan]} color="#0284c7" />
        <PlanRow label={t('browse.enroll.requiredPlan')} plans={requiredPlans} color="#7c3aed" />
        {requiredPlans.map((plan) =>
          (planCourseCounts[plan] ?? 0) > 0 ? (
            <Typography
              key={plan}
              variant="caption"
              sx={{ display: 'block', textAlign: 'right', color: 'grey.700' }}
            >
              {t('browse.enroll.coursesFreeWith', { count: planCourseCounts[plan], plan })}
            </Typography>
          ) : null,
        )}
      </Box>
      <Button
        component={Link}
        href="/pricing"
        fullWidth
        variant="outlined"
        startIcon={<CardMembershipIcon />}
        sx={UPGRADE_BUTTON_SX}
      >
        {t('browse.enroll.upgrade')}
      </Button>
    </>
  );
};
