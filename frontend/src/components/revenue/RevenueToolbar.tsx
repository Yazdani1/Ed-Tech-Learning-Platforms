'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { ExportButtons } from '@/components/common/ExportButtons';
import { InlineSelect } from '@/components/common/InlineSelect';
import { SelectionChip } from '@/components/common/SelectionChip';
import { ORDER_TYPES, type OrderType } from '@/schemas/revenue.schema';

import { PeriodFilter } from './PeriodFilter';
import { RevenueCourseFilter } from './RevenueCourseFilter';

import type { FC } from 'react';

interface RevenueToolbarProps {
  courseLabel: string;
  courseIds: readonly string[];
  onApplyCourses: (ids: string[]) => void;
  type: OrderType;
  onTypeChange: (type: OrderType) => void;
  /** All sales tab only: the period dropdown (a month's details have a fixed period) */
  period?: {
    period: string;
    from: string;
    to: string;
    onChange: (changes: Record<string, string>) => void;
  };
  selectedCount: number;
  onClearSelection: () => void;
  onExportCsv: () => void;
  onPrintPdf: () => void;
}

const ROW_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 1,
  mb: 2,
} as const;

/** One row above the sales table, on the right: period, courses, type, selection, CSV export and PDF print. */
export const RevenueToolbar: FC<RevenueToolbarProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Box sx={ROW_SX}>
      <Box sx={{ mr: 'auto' }}>
        <SelectionChip
          count={props.selectedCount}
          label={t('revenue.selected', { count: props.selectedCount })}
          onClear={props.onClearSelection}
        />
      </Box>
      {props.period && <PeriodFilter {...props.period} />}
      <RevenueCourseFilter
        courseIds={props.courseIds}
        label={props.courseLabel}
        onApply={props.onApplyCourses}
      />
      <InlineSelect
        label={t('revenue.columns.type')}
        value={props.type}
        options={ORDER_TYPES.map((item) => ({ value: item, label: t(`revenue.types.${item}`) }))}
        onChange={(value) => {
          props.onTypeChange(value as OrderType);
        }}
      />
      <ExportButtons onExportCsv={props.onExportCsv} onPrintPdf={props.onPrintPdf} />
    </Box>
  );
};
