'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ExportButtonsProps {
  onExportCsv: () => void;
  /** Left out: no PDF button */
  onPrintPdf?: () => void;
  /** Default "Print students (PDF)" */
  printLabel?: string;
}

const BUTTON_SX = { minHeight: 44 } as const;

/** "Export CSV" and (optional) the PDF print-out button of a list toolbar. */
export const ExportButtons: FC<ExportButtonsProps> = ({ onExportCsv, onPrintPdf, printLabel }) => {
  const { t } = useTranslation();
  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={onExportCsv}
        sx={BUTTON_SX}
      >
        {t('revenue.exportCsv')}
      </Button>
      {onPrintPdf && (
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfOutlinedIcon />}
          onClick={onPrintPdf}
          sx={BUTTON_SX}
        >
          {printLabel ?? t('revenue.printPdf')}
        </Button>
      )}
    </>
  );
};
