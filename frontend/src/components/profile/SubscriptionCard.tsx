'use client';

import CardMembership from '@mui/icons-material/CardMembership';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCancelSubscription, useSubscriptionPlans } from '@/api/catalog.api';
import { useConfirm } from '@/hooks/useConfirm';

import { ActivePlanDetails, PLAN_COLOR } from './ActivePlanDetails';
import { getCurrentPlan } from './subscription.utils';

import type { Profile } from '@/schemas/profile.schema';
import type { FC } from 'react';

interface SubscriptionCardProps {
  profile: Profile;
}

/** Student only: the running plan with Change / Cancel, or a link to the plans. */
export const SubscriptionCard: FC<SubscriptionCardProps> = ({ profile }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const plan = getCurrentPlan(profile.activeSubscription);
  const configs = useSubscriptionPlans();
  const cancel = useCancelSubscription();

  const handleCancel = async (planName: string): Promise<void> => {
    const confirmed = await confirm({
      title: t('profile.cancelTitle'),
      message: t('profile.cancelMessage', { plan: planName }),
      confirmLabel: t('profile.cancelSubscription'),
      destructive: true,
    });
    if (!confirmed) return;
    cancel.mutate(undefined, {
      onSuccess: () => toast.success(t('profile.cancelled')),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CardMembership sx={{ color: PLAN_COLOR }} aria-hidden />
        <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
          {t('profile.subscription')}
        </Typography>
      </Box>
      {plan ? (
        <>
          <ActivePlanDetails
            plan={plan}
            config={configs.data?.find((item) => item.plan === plan.plan)}
          />
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            <Button component={Link} href="/pricing" variant="outlined">
              {t('profile.changePlan')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              loading={cancel.isPending}
              onClick={() => void handleCancel(plan.plan)}
            >
              {t('profile.cancelSubscription')}
            </Button>
          </Stack>
        </>
      ) : (
        <Box sx={{ p: 2.5, borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            {t('profile.noSubscription')}
          </Typography>
          <Button component={Link} href="/pricing" variant="contained">
            {t('profile.viewPlans')}
          </Button>
        </Box>
      )}
    </Paper>
  );
};
