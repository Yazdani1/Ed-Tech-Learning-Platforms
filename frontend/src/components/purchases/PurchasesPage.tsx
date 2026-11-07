'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useMyPurchases } from '@/api/purchases.api';
import { PageHeader } from '@/components/common/PageHeader';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { MONEY_COLOR } from '@/components/enrollments/enrollment-display';
import { useClientPagination } from '@/hooks/useClientPagination';
import { formatBdt } from '@/utils/price';

import { usePurchaseColumns } from './usePurchaseColumns';

const GRID_SX = {
  display: 'grid',
  gap: 1.5,
  gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
  mb: 2.5,
} as const;
const TILE_HEIGHT = 76;

/**
 * /student/purchases: every course the student enrolled in (newest first) with the purchase ID, list price,
 * discount, coupon, amount paid and payment method, and the totals (courses, amount spent, amount saved).
 */
export const PurchasesPage = () => {
  const { t } = useTranslation();
  const query = useMyPurchases();
  const columns = usePurchaseColumns();
  const { pageRows, pagination } = useClientPagination(query.data?.purchases ?? []);
  const totals = query.data?.totals;
  const tiles = totals
    ? [
        { key: 'courses', value: String(totals.courses) },
        { key: 'paidCourses', value: String(totals.paidCourses) },
        { key: 'totalSpent', value: formatBdt(totals.totalSpent), color: MONEY_COLOR },
        { key: 'totalSaved', value: formatBdt(totals.totalSaved) },
      ]
    : [];

  return (
    <Box>
      <PageHeader
        title={t('purchases.title')}
        count={totals?.courses}
        countLabel={t('purchases.count', { count: totals?.courses ?? 0 })}
      />
      <Box component="section" aria-label={t('purchases.totalsLabel')} sx={GRID_SX}>
        {query.isPending
          ? Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} variant="rounded" height={TILE_HEIGHT} />
            ))
          : tiles.map((tile) => (
              <Paper key={tile.key} variant="outlined" sx={{ p: 1.5, boxShadow: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t(`purchases.totals.${tile.key}`)}
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color: tile.color }}>
                  {tile.value}
                </Typography>
              </Paper>
            ))}
      </Box>
      <ResponsiveDataView
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyText={t('purchases.empty')}
        rows={pageRows}
        columns={columns}
        getRowId={(row) => row._id}
        label={t('purchases.title')}
        pagination={pagination}
      />
    </Box>
  );
};
