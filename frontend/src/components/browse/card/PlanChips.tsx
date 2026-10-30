'use client';

import CardMembershipIcon from '@mui/icons-material/CardMembership';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface PlanChipsProps {
  plans: readonly string[];
}

const PLAN_COLORS: Record<string, string> = {
  Basic: '#2563eb',
  Premium: '#7c3aed',
  Gold: '#d97706',
  'Quiz Only': '#0891b2',
};
const DEFAULT_PLAN_COLOR = '#7c3aed';

/** "Included with subscription" box with a coloured chip per plan. */
export const PlanChips: FC<PlanChipsProps> = ({ plans }) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        p: 1.25,
        mb: 1.75,
        borderRadius: 1,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, mb: 0.75 }}>
        {t('browse.card.includedWithSubscription')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {plans.map((plan) => (
          <Chip
            key={plan}
            icon={<CardMembershipIcon sx={{ fontSize: 12, color: 'inherit !important' }} />}
            label={plan}
            size="small"
            sx={{
              bgcolor: PLAN_COLORS[plan] ?? DEFAULT_PLAN_COLOR,
              color: 'common.white',
              fontWeight: 800,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
