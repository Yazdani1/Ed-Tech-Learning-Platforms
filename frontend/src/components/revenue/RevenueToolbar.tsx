'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { RevenueCourseFilter } from './RevenueCourseFilter';

import type { FC } from 'react';

interface RevenueToolbarProps {
  courseLabel: string;
  courseIds: readonly string[];
  onApplyCourses: (ids: string[]) => void;
  selectedCount: number;
  onClearSelection: () => void;
  onExportCsv: () => void;
  onPrintPdf: () => void;
}

const BUTTON_SX = { minHeight: 44 } as const;
const ROW_SX = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 } as const;

/** Course filter (opens the course list on the left), the selection count, CSV export and PDF print. */
export const RevenueToolbar: FC<RevenueToolbarProps> = ({
  courseLabel,
  courseIds,
  onApplyCourses,
  selectedCount,
  onClearSelection,
  onExportCsv,
  onPrintPdf,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={ROW_SX}>
      <RevenueCourseFilter courseIds={courseIds} label={courseLabel} onApply={onApplyCourses} />
      <Box sx={{ flexGrow: 1 }} />
      {selectedCount > 0 && (
        <Chip
          label={t('revenue.selected', { count: selectedCount })}
          onDelete={onClearSelection}
          color="primary"
          variant="outlined"
          sx={{ minHeight: 36 }}
        />
      )}
      <Button
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={onExportCsv}
        disabled={selectedCount === 0}
        sx={BUTTON_SX}
      >
        {t('revenue.exportCsv')}
      </Button>
      <Button
        variant="outlined"
        startIcon={<PictureAsPdfOutlinedIcon />}
        onClick={onPrintPdf}
        sx={BUTTON_SX}
      >
        {t('revenue.printPdf')}
      </Button>
    </Box>
  );
};
