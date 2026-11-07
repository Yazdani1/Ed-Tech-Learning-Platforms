'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCourseOrders } from '@/api/revenue.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { useOrderColumns } from '@/components/orders/useOrderColumns';
import { useOrderSelectColumn } from '@/components/orders/useOrderSelectColumn';
import { useOrderSelection } from '@/components/revenue/useOrderSelection';
import { useClientPagination } from '@/hooks/useClientPagination';
import { useModal } from '@/hooks/useModal';

import { EMPTY_FILTERS, filterCourseOrders, type CourseOrderFilters } from './course-order-filters';
import { CourseOrdersActions } from './CourseOrdersActions';
import { CourseOrdersFilters } from './CourseOrdersFilters';
import { CourseOrdersTotals } from './CourseOrdersTotals';

import type { Order } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface CourseOrdersPanelProps {
  courseId: string;
  courseTitle: string;
}

const ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  flexWrap: 'wrap',
  mb: 1.5,
} as const;

/**
 * Super Admin / Admin: every enrolment of the course with filters, tick boxes, the totals of what is shown
 * (sales and VAT), a CSV with every detail and the totals, and student tokens (grid PDF to cut for a draw).
 */
export const CourseOrdersPanel: FC<CourseOrdersPanelProps> = ({ courseId, courseTitle }) => {
  const { t } = useTranslation();
  const headingId = useId();
  const [filters, setFilters] = useState<CourseOrderFilters>(EMPTY_FILTERS);
  const orders = useCourseOrders(courseId, true);
  const selection = useOrderSelection();
  const columns = [useOrderSelectColumn(selection), ...useOrderColumns({ showCourse: false })];
  const details = useModal<Order>();
  const rows = useMemo(
    () => filterCourseOrders(orders.data ?? [], filters),
    [orders.data, filters],
  );
  const { pageRows, pagination } = useClientPagination(rows);

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Box sx={ROW_SX}>
        <Typography
          id={headingId}
          component="h2"
          sx={{ fontWeight: 700, fontSize: '1.125rem', mr: 'auto' }}
        >
          {t('adminCourses.enrollments.enrolledStudents')}
        </Typography>
        <CourseOrdersActions
          courseId={courseId}
          courseTitle={courseTitle}
          selection={selection}
          rows={rows}
        />
      </Box>
      <CourseOrdersFilters
        filters={filters}
        onChange={(changes) => {
          setFilters((current) => ({ ...current, ...changes }));
          pagination.onPageChange(1);
        }}
      />
      {orders.data && <CourseOrdersTotals rows={rows} />}
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
      <OrderDetailsDrawer order={details.data} open={details.open} onClose={details.closeModal} />
    </Box>
  );
};
