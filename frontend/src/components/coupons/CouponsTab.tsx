'use client';

import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useCourseCoupons } from '@/api/coupons.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { useClientPagination } from '@/hooks/useClientPagination';
import { useModal } from '@/hooks/useModal';

import { CouponFormModal } from './CouponFormModal';
import { useCouponActions } from './useCouponActions';
import { useCouponColumns } from './useCouponColumns';

import type { Course } from '@/schemas/browse.schema';
import type { CourseCoupon } from '@/schemas/coupon.schema';
import type { FC } from 'react';

interface CouponsTabProps {
  course: Course;
}

const HEADER_SX = {
  display: 'flex',
  alignItems: { sm: 'center' },
  justifyContent: 'space-between',
  flexDirection: { xs: 'column', sm: 'row' },
  gap: 2,
  mb: 2,
} as const;

/**
 * Course editor > Coupons: every code of the course — its own discount (from the Pricing page), its coupons and
 * the promos it is in — with dates, uses and status. Coupons can be added, edited, switched off or deleted.
 */
export const CouponsTab: FC<CouponsTabProps> = ({ course }) => {
  const { t } = useTranslation();
  const query = useCourseCoupons(course._id);
  const modal = useModal<CourseCoupon>();
  const actions = useCouponActions(course._id);
  const columns = useCouponColumns({ ...actions, onEdit: modal.openModal });
  const { pageRows, pagination } = useClientPagination(query.data ?? []);

  if (course.pricing !== 'Paid') return <Alert severity="info">{t('coupons.paidOnly')}</Alert>;

  return (
    <Box>
      <Box sx={HEADER_SX}>
        <Box>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            {t('coupons.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('coupons.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            modal.openModal();
          }}
          sx={{ minHeight: 44, flexShrink: 0 }}
        >
          {t('coupons.add')}
        </Button>
      </Box>
      <ResponsiveDataView
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyText={t('coupons.empty')}
        rows={pageRows}
        columns={columns}
        getRowId={(row) => row._id}
        label={t('coupons.title')}
        pagination={pagination}
      />
      <CouponFormModal
        courseId={course._id}
        open={modal.open}
        coupon={modal.data}
        onClose={modal.closeModal}
      />
    </Box>
  );
};
