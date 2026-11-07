'use client';

import { useTranslation } from 'react-i18next';

import { ExportButtons } from '@/components/common/ExportButtons';
import { SelectionChip } from '@/components/common/SelectionChip';
import { ExportOrdersModal } from '@/components/revenue/ExportOrdersModal';
import { PrintStudentsModal } from '@/components/revenue/PrintStudentsModal';

import { useCourseOrderOutputs } from './useCourseOrderOutputs';

import type { OrderSelection } from '@/components/revenue/useOrderSelection';
import type { Order } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface CourseOrdersActionsProps {
  courseId: string;
  courseTitle: string;
  selection: OrderSelection;
  /** The rows the filters show now */
  rows: readonly Order[];
}

/** The selection chip, "Export CSV" (every detail + totals) and "Student tokens (PDF)" with their dialogs. */
export const CourseOrdersActions: FC<CourseOrdersActionsProps> = ({
  courseId,
  courseTitle,
  selection,
  rows,
}) => {
  const { t } = useTranslation();
  const out = useCourseOrderOutputs(
    selection.selected,
    rows,
    courseTitle,
    `enrolments-${courseId}`,
  );
  const count = selection.selected.length;
  const shared = {
    selectedCount: count,
    filterLabel: t('adminCourses.enrollments.shownRows', { count: rows.length }),
    onClose: out.closeAll,
  };
  return (
    <>
      <SelectionChip
        count={count}
        label={t('revenue.selected', { count })}
        onClear={selection.clear}
      />
      <ExportButtons
        onExportCsv={() => {
          out.exportModal.openModal();
        }}
        onPrintPdf={() => {
          out.tokenModal.openModal();
        }}
        printLabel={t('adminCourses.enrollments.tokens')}
      />
      {out.exportModal.open && (
        <ExportOrdersModal
          {...shared}
          exporting={false}
          defaultIncludeContact
          onExport={out.exportCsv}
        />
      )}
      {out.tokenModal.open && (
        <PrintStudentsModal
          {...shared}
          title={t('adminCourses.enrollments.tokensTitle')}
          printing={false}
          onPrint={out.printTokens}
        />
      )}
    </>
  );
};
