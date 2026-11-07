'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { MONEY_COLOR } from '@/components/enrollments/enrollment-display';
import { formatBdt } from '@/utils/price';

import type { RevenueBreakdown } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface SalesTotalsProps {
  data: RevenueBreakdown | undefined;
  isPending: boolean;
}

const GRID_SX = {
  display: 'grid',
  gap: 1.5,
  gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
  mb: 2,
} as const;
const TILE_HEIGHT = 76;

/** Totals of the filtered sales: sales, VAT, net and enrolments (paid / free / subscription). */
export const SalesTotals: FC<SalesTotalsProps> = ({ data, isPending }) => {
  const { t } = useTranslation();
  if (isPending || !data) {
    return (
      <Box sx={GRID_SX}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={TILE_HEIGHT} />
        ))}
      </Box>
    );
  }
  const tiles = [
    { key: 'sales', value: formatBdt(data.revenue), color: MONEY_COLOR },
    { key: 'vat', value: formatBdt(data.vat) },
    { key: 'net', value: formatBdt(data.netRevenue) },
    {
      key: 'orders',
      value: String(data.orders),
      hint: t('revenue.totals.ordersHint', {
        paid: data.paidOrders,
        free: data.freeOrders,
        subscription: data.subscriptionOrders,
      }),
    },
  ];
  return (
    <Box component="section" aria-label={t('revenue.totals.label')} sx={GRID_SX}>
      {tiles.map((tile) => (
        <Paper key={tile.key} variant="outlined" sx={{ p: 1.5, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {t(`revenue.totals.${tile.key}`)}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: tile.color }}>
            {tile.value}
          </Typography>
          {tile.hint && (
            <Typography variant="caption" color="text.secondary" component="p" noWrap>
              {tile.hint}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
};
