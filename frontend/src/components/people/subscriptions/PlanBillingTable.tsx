'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatBdt } from '@/utils/price';

import type { BillingOption } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PlanBillingTableProps {
  options: BillingOption[];
}

/** A plan's billing options: label and months on the left, price and price per month on the right. */
export const PlanBillingTable: FC<PlanBillingTableProps> = ({ options }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, mb: 2 }}>
      {options.map((option) => {
        const months = t('people.plans.months', { count: option.duration });
        return (
          <Box
            key={option.duration}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1.5,
              px: 1.5,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider',
              '&:last-of-type': { borderBottom: 0 },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {option.label || months}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {months}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                {formatBdt(option.price)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.duration === 1
                  ? t('people.plans.perMonth')
                  : t('people.plans.monthly', {
                      price: formatBdt(Math.round(option.price / option.duration)),
                    })}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
