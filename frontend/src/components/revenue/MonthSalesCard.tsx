'use client';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { MONEY_COLOR } from '@/components/enrollments/enrollment-display';
import { formatBdt } from '@/utils/price';

import { formatMonth } from './revenue-period';

import type { RevenueMonth } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface MonthSalesCardProps {
  month: RevenueMonth;
  /** The newest month gets a "This month" style chip */
  latest: boolean;
  onOpen: () => void;
}

const STAT_SX = { display: 'flex', justifyContent: 'space-between', gap: 1 } as const;

/** One month: total sales, VAT and enrolments (paid of all); opens the month's sales. */
export const MonthSalesCard: FC<MonthSalesCardProps> = ({ month, latest, onOpen }) => {
  const { t, i18n } = useTranslation();
  const label = formatMonth(month.month, i18n.language);
  return (
    <Card variant="outlined" sx={{ boxShadow: 1, borderRadius: 2 }}>
      <CardActionArea onClick={onOpen} aria-label={t('revenue.monthly.open', { month: label })}>
        <Box sx={{ p: 2.5, display: 'grid', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography component="h2" sx={{ fontWeight: 700, flex: 1 }}>
              {label}
            </Typography>
            {latest && <Chip size="small" color="primary" label={t('revenue.monthly.latest')} />}
            <ChevronRightIcon color="action" />
          </Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: MONEY_COLOR }}>
            {formatBdt(month.revenue)}
          </Typography>
          <Box sx={STAT_SX}>
            <Typography variant="body2" color="text.secondary">
              {t('revenue.monthly.enrolments', { count: month.orders, paid: month.paidOrders })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('revenue.monthly.vat', { amount: formatBdt(month.vat) })}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  );
};
