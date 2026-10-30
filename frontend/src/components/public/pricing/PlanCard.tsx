'use client';

import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import { useTranslation } from 'react-i18next';

import { PlanAction } from './PlanAction';
import { PlanCardContent } from './PlanCardContent';
import { accentColor, getBillingOptions, isCurrentPlan } from './pricing.utils';

import type { Subscription, SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PlanCardProps {
  plan: SubscriptionPlan;
  period: number | null;
  /** The signed-in Student's running subscription */
  subscription: Subscription | null;
  subscribing: boolean;
  onSubscribe: (plan: string, duration: number) => void;
  onViewCourses: (plan: SubscriptionPlan) => void;
}

const ACTIONS_SX = {
  p: 2,
  pt: 0,
  flexDirection: 'column',
  gap: 1,
  '& > :not(style) ~ :not(style)': { ml: 0 },
} as const;

const cardSx = (color: string, isCurrent: boolean, available: boolean) =>
  ({
    borderRadius: 3,
    border: 2,
    borderColor: isCurrent ? color : 'divider',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'visible',
    opacity: available ? 1 : 0.72,
  }) as const;

const viewCoursesSx = (color: string) =>
  ({
    minHeight: 44,
    borderRadius: 999,
    fontWeight: 900,
    background: `linear-gradient(135deg, ${color} 0%, #0ea5e9 100%)`,
  }) as const;

/** One subscription plan: name, price for the chosen period, features and actions. */
export const PlanCard: FC<PlanCardProps> = (props) => {
  const { plan, period, subscription, subscribing, onSubscribe, onViewCourses } = props;
  const { t } = useTranslation();
  const color = accentColor(plan);
  const options = getBillingOptions(plan);
  const selected = options.find((option) => option.duration === period);
  const isCurrent = isCurrentPlan(subscription, plan.plan, selected?.duration);

  return (
    <Card
      component="article"
      aria-label={plan.plan}
      elevation={isCurrent ? 6 : 1}
      sx={cardSx(color, isCurrent, Boolean(selected))}
    >
      <PlanCardContent
        plan={plan}
        color={color}
        options={options}
        selected={selected}
        period={period}
        isCurrent={isCurrent}
      />
      <CardActions sx={ACTIONS_SX}>
        {plan.courseCount > 0 && (
          <Button
            fullWidth
            variant="contained"
            startIcon={<SchoolIcon fontSize="small" />}
            onClick={() => {
              onViewCourses(plan);
            }}
            sx={viewCoursesSx(color)}
          >
            {t('public.pricing.viewCourses', { count: plan.courseCount })}
          </Button>
        )}
        <Box sx={{ width: '100%' }}>
          <PlanAction
            planName={plan.plan}
            color={color}
            available={Boolean(selected)}
            isCurrent={isCurrent}
            hasRunningPlan={subscription !== null}
            runningPlanName={subscription?.plan}
            subscribing={subscribing}
            onSubscribe={() => {
              if (selected) onSubscribe(plan.plan, selected.duration);
            }}
          />
        </Box>
      </CardActions>
    </Card>
  );
};
