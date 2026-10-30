'use client';

import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PlanFeatures } from './PlanFeatures';
import { PlanPrice } from './PlanPrice';

import type { BillingOption, SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PlanCardContentProps {
  plan: SubscriptionPlan;
  color: string;
  options: BillingOption[];
  selected: BillingOption | undefined;
  period: number | null;
  isCurrent: boolean;
}

const CURRENT_COLOR = '#16a34a';

/** Badge, plan name, price, included-course count and features of a plan card. */
export const PlanCardContent: FC<PlanCardContentProps> = ({
  plan,
  color,
  options,
  selected,
  period,
  isCurrent,
}) => {
  const { t } = useTranslation();
  const badge = isCurrent ? t('public.pricing.currentBadge') : plan.badge;
  return (
    <>
      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: isCurrent ? CURRENT_COLOR : color,
            color: 'common.white',
            fontWeight: 700,
          }}
        />
      )}
      <CardContent sx={{ flex: 1, pt: badge ? 3.5 : 2.5 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700, color, mb: 0.5 }}>
          {plan.plan}
        </Typography>
        <PlanPrice options={options} selected={selected} period={period} />
        {plan.courseCount > 0 && (
          <Typography variant="caption" sx={{ display: 'block', color, fontWeight: 700, mt: 1 }}>
            {t('public.pricing.coursesIncluded', { count: plan.courseCount })}
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <PlanFeatures features={plan.features} color={color} />
      </CardContent>
    </>
  );
};
