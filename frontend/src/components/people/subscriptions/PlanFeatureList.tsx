'use client';

import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface PlanFeatureListProps {
  features: string[];
  accent: string;
}

/** The plan's features with a tick each (or "No features added yet."). */
export const PlanFeatureList: FC<PlanFeatureListProps> = ({ features, accent }) => {
  const { t } = useTranslation();
  if (features.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('people.plans.noFeatures')}
      </Typography>
    );
  }
  return (
    <Box component="ul" sx={{ display: 'grid', gap: 0.75, m: 0, p: 0, listStyle: 'none' }}>
      {features.map((feature, index) => (
        <Box component="li" key={`${feature}-${index}`} sx={{ display: 'flex', gap: 1 }}>
          <CheckIcon sx={{ fontSize: 16, color: accent, mt: 0.25 }} aria-hidden />
          <Typography variant="body2">{feature}</Typography>
        </Box>
      ))}
    </Box>
  );
};
