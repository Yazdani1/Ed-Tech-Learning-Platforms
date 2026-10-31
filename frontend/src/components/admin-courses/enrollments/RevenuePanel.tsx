'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { usePaidEnrollments } from '@/api/admin-courses.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { formatBdt } from '@/utils/price';

import { MONEY_COLOR } from '@/components/enrollments/enrollment-display';
import { useRevenueColumns } from './useEnrollmentColumns';

import type { FC } from 'react';

interface RevenuePanelProps {
  courseId: string;
}

const HEADER_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  flexWrap: 'wrap',
  mb: 1.5,
} as const;

/** "Revenue" (Super Admin, Admin): every paid enrolment with its price snapshot, and the total paid. */
export const RevenuePanel: FC<RevenuePanelProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const headingId = useId();
  const paid = usePaidEnrollments(courseId, true);
  const columns = useRevenueColumns();
  const rows = paid.data ?? [];
  const total = rows.reduce((sum, row) => sum + row.paidPrice, 0);

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Box sx={HEADER_SX}>
        <Typography id={headingId} component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          {t('adminCourses.enrollments.revenue')}
        </Typography>
        {paid.data && (
          <Typography variant="body2" sx={{ fontWeight: 700, color: MONEY_COLOR }}>
            {t('adminCourses.enrollments.total', { amount: formatBdt(total) })}
          </Typography>
        )}
      </Box>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <ResponsiveDataView
          isLoading={paid.isLoading}
          error={paid.error}
          onRetry={() => void paid.refetch()}
          emptyText={t('adminCourses.enrollments.noPaid')}
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          label={t('adminCourses.enrollments.revenueLabel')}
        />
      </Paper>
    </Box>
  );
};
