'use client';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMySubscription, useSubscriptionPlans } from '@/api/catalog.api';
import { QueryState } from '@/components/common/QueryState';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { usePublicSubscribe } from '@/hooks/usePublicSubscribe';
import { STUDENT_ROLES } from '@/utils/roles';

import { BillingToggle } from './BillingToggle';
import { GuestSignInBox } from './GuestSignInBox';
import { PlanCard } from './PlanCard';
import { PlanCoursesModal } from './PlanCoursesModal';
import { PricingHero } from './PricingHero';
import { billingPeriods, defaultPeriod, runningSubscription } from './pricing.utils';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';

/**
 * /pricing: the subscription plans. Students subscribe at once (no payment gateway yet; the server takes
 * the price from the plan), guests are sent to sign in first.
 */
export const PricingPage = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, hasRole } = useAuth();
  const isStudent = hasRole(STUDENT_ROLES);
  const plansQuery = useSubscriptionPlans();
  const { data: mySubscription } = useMySubscription(isStudent);
  const { subscribeTo, pendingPlan } = usePublicSubscribe();
  const coursesModal = useModal<SubscriptionPlan>();
  const [now] = useState(() => Date.now());
  const [chosenPeriod, setChosenPeriod] = useState<number | null>(null);

  const plans = plansQuery.data ?? [];
  const periods = billingPeriods(plans);
  const period =
    chosenPeriod !== null && periods.includes(chosenPeriod) ? chosenPeriod : defaultPeriod(periods);
  const subscription = isStudent ? runningSubscription(mySubscription, now) : null;

  return (
    <>
      <PricingHero subscription={subscription} />
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
        <QueryState
          isLoading={plansQuery.isPending}
          error={plansQuery.error}
          onRetry={() => void plansQuery.refetch()}
          isEmpty={plans.length === 0}
          emptyText={t('public.pricing.empty')}
        >
          <BillingToggle periods={periods} value={period} onChange={setChosenPeriod} />
          <Grid container spacing={3} sx={{ justifyContent: 'center', pt: 1.5 }}>
            {plans.map((plan) => (
              <Grid key={plan._id} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
                <PlanCard
                  plan={plan}
                  period={period}
                  subscription={subscription}
                  subscribing={pendingPlan === plan.plan}
                  onSubscribe={subscribeTo}
                  onViewCourses={coursesModal.openModal}
                />
              </Grid>
            ))}
          </Grid>
          {!authLoading && !user && <GuestSignInBox />}
        </QueryState>
      </Container>
      <PlanCoursesModal
        open={coursesModal.open}
        plan={coursesModal.data}
        onClose={coursesModal.closeModal}
      />
    </>
  );
};
