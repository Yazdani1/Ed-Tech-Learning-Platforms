'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCourseOrders } from '@/api/revenue.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { MONEY_COLOR } from '@/components/enrollments/enrollment-display';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { OrderTypeTabs } from '@/components/orders/OrderTypeTabs';
import { useOrderColumns } from '@/components/orders/useOrderColumns';
import { useClientPagination } from '@/hooks/useClientPagination';
import { useModal } from '@/hooks/useModal';
import { formatBdt } from '@/utils/price';

import type { Order, OrderType } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface CourseOrdersPanelProps {
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

/**
 * Super Admin / Admin: every enrolment of the course (All, Free, Paid, Subscription) with list price, discount,
 * coupon and amount paid; a row opens the purchase details on the right. 10 per page.
 */
export const CourseOrdersPanel: FC<CourseOrdersPanelProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const headingId = useId();
  const [type, setType] = useState<OrderType>('all');
  const orders = useCourseOrders(courseId, true);
  const columns = useOrderColumns({ showCourse: false });
  const details = useModal<Order>();
  const rows = useMemo(
    () => (orders.data ?? []).filter((row) => type === 'all' || row.enrollmentType === type),
    [orders.data, type],
  );
  const { pageRows, pagination } = useClientPagination(rows);
  const paidTotal = rows.reduce((sum, row) => sum + row.paidPrice, 0);

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Box sx={HEADER_SX}>
        <Typography id={headingId} component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          {t('adminCourses.enrollments.enrolledStudents')}
        </Typography>
        {orders.data && (
          <Typography variant="body2" sx={{ fontWeight: 700, color: MONEY_COLOR }}>
            {t('adminCourses.enrollments.total', { amount: formatBdt(paidTotal) })}
          </Typography>
        )}
      </Box>
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <OrderTypeTabs
          value={type}
          onChange={(next) => {
            setType(next);
            pagination.onPageChange(1);
          }}
        />
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <ResponsiveDataView
            isLoading={orders.isLoading}
            error={orders.error}
            onRetry={() => void orders.refetch()}
            emptyText={t('adminCourses.enrollments.noStudents')}
            rows={pageRows}
            columns={columns}
            getRowId={(row) => row._id}
            label={t('adminCourses.enrollments.studentsLabel')}
            onRowClick={details.openModal}
            pagination={pagination}
          />
        </Box>
      </Paper>
      <OrderDetailsDrawer order={details.data} open={details.open} onClose={details.closeModal} />
    </Box>
  );
};
