'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useRevenueOrders, useRevenueSummary } from '@/api/revenue.api';
import { useStudentCourses } from '@/api/students.api';
import { PageHeader } from '@/components/common/PageHeader';
import { courseSelectionLabel } from '@/components/course-picker/course-picker.utils';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';
import { PAGE_SIZE } from '@/hooks/useClientPagination';
import { useModal } from '@/hooks/useModal';

import { exportOrdersCsv } from './order-export';
import { PrintStudentsModal } from './PrintStudentsModal';
import { RevenueOrders } from './RevenueOrders';
import { RevenueOverview } from './RevenueOverview';
import { RevenueToolbar } from './RevenueToolbar';
import { useOrderSelection } from './useOrderSelection';
import { useRevenueParams } from './useRevenueParams';
import { useRevenuePrint } from './useRevenuePrint';

import type { Order } from '@/schemas/revenue.schema';

/** The Revenue page body (inside the role check and Suspense of RevenuePage). */
export const RevenueContent = () => {
  const { t, i18n } = useTranslation();
  const { params, setParams, courseIds, filters } = useRevenueParams();
  const summary = useRevenueSummary(filters);
  const orders = useRevenueOrders(filters, params.page, PAGE_SIZE);
  const courseLabel = courseSelectionLabel(t, courseIds, useStudentCourses().data);
  const selection = useOrderSelection();
  const details = useModal<Order>();
  const printModal = useModal();
  const pdf = useRevenuePrint(selection.selected, filters, courseLabel, printModal.closeModal);

  return (
    <Box>
      <PageHeader title={t('revenue.title')} subtitle={t('revenue.subtitle')} />
      <RevenueToolbar
        courseLabel={courseLabel}
        courseIds={courseIds}
        onApplyCourses={(ids) => {
          setParams({ courses: ids.join(',') });
        }}
        selectedCount={selection.selected.length}
        onClearSelection={selection.clear}
        onExportCsv={() => {
          exportOrdersCsv(t, selection.selected, i18n.language);
        }}
        onPrintPdf={() => {
          printModal.openModal();
        }}
      />
      <RevenueOverview
        summary={summary.data}
        isPending={summary.isPending}
        error={summary.error}
        onRetry={() => void summary.refetch()}
      />
      <RevenueOrders
        type={params.type}
        onTypeChange={(type) => {
          setParams({ type });
        }}
        orders={orders}
        onRetry={() => void orders.refetch()}
        onPageChange={(page) => {
          setParams({ page });
        }}
        selection={selection}
        onOpen={details.openModal}
      />
      <OrderDetailsDrawer order={details.data} open={details.open} onClose={details.closeModal} />
      {printModal.open && (
        <PrintStudentsModal
          onClose={printModal.closeModal}
          selectedCount={selection.selected.length}
          filterLabel={courseLabel}
          printing={pdf.printing}
          onPrint={pdf.print}
        />
      )}
    </Box>
  );
};
