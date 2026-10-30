'use client';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { STUDENT_ROLES } from '@/utils/roles';

import type { FC } from 'react';

/** Guests sign in and come straight back to the plans. */
export const PRICING_SIGN_IN_HREF = `/auth/login?next=${encodeURIComponent('/pricing')}`;

interface PlanActionProps {
  planName: string;
  color: string;
  /** The selected period is offered by this plan */
  available: boolean;
  /** The Student already has exactly this plan and period */
  isCurrent: boolean;
  /** The Student has some running plan (the button then says "Switch") */
  hasRunningPlan: boolean;
  /** The plan the Student has now, if any */
  runningPlanName: string | undefined;
  subscribing: boolean;
  onSubscribe: () => void;
}

/** The main button of a plan card: sign in, subscribe, switch, or why it is not possible. */
export const PlanAction: FC<PlanActionProps> = ({
  planName,
  color,
  available,
  isCurrent,
  hasRunningPlan,
  runningPlanName,
  subscribing,
  onSubscribe,
}) => {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const sx = { minHeight: 44, borderRadius: 2, fontWeight: 700 };
  const filled = { ...sx, bgcolor: color, '&:hover': { bgcolor: color, opacity: 0.9 } };

  if (!available || isCurrent) {
    return (
      <Button fullWidth variant="outlined" disabled sx={sx}>
        {t(isCurrent ? 'public.pricing.activePlan' : 'public.pricing.notAvailableButton')}
      </Button>
    );
  }
  if (!user) {
    return (
      <Button
        fullWidth
        variant="contained"
        component={Link}
        href={PRICING_SIGN_IN_HREF}
        sx={filled}
      >
        {t('public.pricing.getStarted')}
      </Button>
    );
  }
  // Same rule as the backend: only Students may subscribe
  if (!hasRole(STUDENT_ROLES)) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
        {t('public.pricing.studentsOnly')}
      </Typography>
    );
  }
  const label = !hasRunningPlan
    ? 'public.pricing.subscribe'
    : runningPlanName === planName
      ? 'public.pricing.switchBilling'
      : 'public.pricing.switchPlan';
  return (
    <Button fullWidth variant="contained" disabled={subscribing} onClick={onSubscribe} sx={filled}>
      {subscribing ? (
        <CircularProgress size={20} color="inherit" aria-label={t('common.saving')} />
      ) : (
        t(label)
      )}
    </Button>
  );
};
