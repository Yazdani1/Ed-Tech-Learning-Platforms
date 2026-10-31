'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PlanBillingTable } from './PlanBillingTable';
import { PlanCardActions } from './PlanCardActions';
import { PlanFeatureList } from './PlanFeatureList';
import { getBillingOptions, planColor } from './plan-utils';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PlanCardProps {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
}

const ACCENT_HEIGHT = 5;

/** One plan: name, badge, every billing option with its monthly price, features, Edit and Delete. */
export const PlanCard: FC<PlanCardProps> = ({ plan, onEdit }) => {
  const { t } = useTranslation();
  const accent = planColor(plan.plan, plan.color);
  const options = [...getBillingOptions(plan)].sort((a, b) => a.duration - b.duration);

  return (
    <Card
      variant="outlined"
      component="article"
      aria-label={plan.plan}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderColor: accent }}
    >
      <Box sx={{ height: ACCENT_HEIGHT, bgcolor: accent }} />
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 900, color: accent, overflowWrap: 'anywhere' }}
            >
              {plan.plan}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t('people.plans.optionCount', { count: options.length })}
            </Typography>
          </Box>
          {plan.badge && (
            <Chip label={plan.badge} size="small" sx={{ bgcolor: accent, color: 'common.white' }} />
          )}
        </Box>
        <PlanBillingTable options={options} />
        <Divider sx={{ mb: 1.5 }} />
        <PlanFeatureList features={plan.features} accent={accent} />
      </CardContent>
      <PlanCardActions plan={plan} onEdit={onEdit} />
    </Card>
  );
};
