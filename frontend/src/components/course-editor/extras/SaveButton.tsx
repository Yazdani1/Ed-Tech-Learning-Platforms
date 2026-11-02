'use client';

import SaveIcon from '@mui/icons-material/Save';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface SaveButtonProps {
  onClick: () => void;
  saving: boolean;
  disabled?: boolean;
}

/** The "Save section" button of a course page section tab. */
export const SaveButton: FC<SaveButtonProps> = ({ onClick, saving, disabled = false }) => {
  const { t } = useTranslation();
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={saving || disabled}
      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
      sx={{ minHeight: 44, fontWeight: 700 }}
    >
      {t('catalog.extras.saveSection')}
    </Button>
  );
};
