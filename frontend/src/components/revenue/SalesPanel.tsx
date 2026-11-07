'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useRevenueBreakdown, useRevenueOrders } from '@/api/revenue.api';
import { useStudentCourses } from '@/api/students.api';
import { courseSelectionLabel } from '@/components/course-picker/course-picker.utils';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { PAGE_SIZE } from '@/hooks/useClientPagination';
import { useModal } from '@/hooks/useModal';

import { RevenueOrders } from './RevenueOrders';
import { RevenueToolbar } from './RevenueToolbar';
import { SalesOutputDialogs } from './SalesOutputDialogs';
import { SalesTotals } from './SalesTotals';
import { useOrderSelection } from './useOrderSelection';

import type { useRevenueParams } from './useRevenueParams';
import type { Order } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface SalesPanelProps {
  revenue: ReturnType<typeof useRevenueParams>;
  /** All sales tab: the period dropdown; a month's details use the month */
  showPeriod: boolean;
  /** CSV file name prefix */
  fileName: string;
}

/**
 * Filters (period, courses, type), totals of what is filtered (sales, VAT, net, enrolments), every sale with a
 * tick box (10 per page), the order drawer, the CSV export and the students print-out.
 */
export const SalesPanel: FC<SalesPanelProps> = ({ revenue, showPeriod, fileName }) => {
  const { t } = useTranslation();
  const { params, setParams, courseIds, filters } = revenue;
  const orders = useRevenueOrders(filters, params.page, PAGE_SIZE);
  const totals = useRevenueBreakdown(filters);
  const courseLabel = courseSelectionLabel(t, courseIds, useStudentCourses().data);
  const selection = useOrderSelection();
  const details = useModal<Order>();
  const printModal = useModal();
  const exportModal = useModal();

  return (
    <Box>
      <RevenueToolbar
        courseLabel={courseLabel}
        courseIds={courseIds}
        onApplyCourses={(ids) => {
          setParams({ courses: ids.join(',') });
        }}
        type={params.type}
        onTypeChange={(type) => {
          setParams({ type: type === 'all' ? '' : type });
        }}
        period={
          showPeriod
            ? { period: params.period, from: params.from, to: params.to, onChange: setParams }
            : undefined
        }
        selectedCount={selection.selected.length}
        onClearSelection={selection.clear}
        onExportCsv={exportModal.openModal}
        onPrintPdf={printModal.openModal}
      />
      <SalesTotals data={totals.data} isPending={totals.isPending} />
      <RevenueOrders
        orders={orders}
        onRetry={() => void orders.refetch()}
        onPageChange={(page) => {
          setParams({ page });
        }}
        selection={selection}
        onOpen={details.openModal}
      />
      <OrderDetailsDrawer order={details.data} open={details.open} onClose={details.closeModal} />
      <SalesOutputDialogs
        printModal={printModal}
        exportModal={exportModal}
        selection={selection}
        filters={filters}
        courseLabel={courseLabel}
        fileName={fileName}
      />
    </Box>
  );
};
