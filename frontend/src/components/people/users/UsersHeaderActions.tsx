'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { AddButton } from '@/components/people/common/AddButton';

import type { FC } from 'react';

interface UsersHeaderActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExport: () => void;
  onCreate: () => void;
}

/** Title row actions of the user list: the ticked count, "Export CSV" and "Create user". */
export const UsersHeaderActions: FC<UsersHeaderActionsProps> = ({
  selectedCount,
  onClearSelection,
  onExport,
  onCreate,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {selectedCount > 0 && (
        <Chip
          label={t('people.students.selected', { count: selectedCount })}
          onDelete={onClearSelection}
          color="primary"
          variant="outlined"
          sx={{ alignSelf: 'center' }}
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
      <AddButton label={t('people.users.create')} onClick={onCreate} />
    </>
  );
};
