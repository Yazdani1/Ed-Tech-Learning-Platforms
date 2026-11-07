'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface StudentsExportActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExport: () => void;
}

/** Super Admin: how many students are ticked and the CSV export button (right end of the toolbar). */
export const StudentsExportActions: FC<StudentsExportActionsProps> = ({
  selectedCount,
  onClearSelection,
  onExport,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: { sm: 'auto' } }}>
      {selectedCount > 0 && (
        <Chip
          label={t('people.students.selected', { count: selectedCount })}
          onDelete={onClearSelection}
          color="primary"
          variant="outlined"
        />
      )}
      <Button
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={onExport}
        sx={{ minHeight: 44 }}
      >
        {t('people.students.exportCsv')}
      </Button>
    </Box>
  );
};
