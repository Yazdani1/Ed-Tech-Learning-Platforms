'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

interface AppModalActionsProps {
  onClose: () => void;
  /** Shows the primary (submit) button */
  hasSave: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  saving: boolean;
  saveDisabled: boolean;
  saveColor: 'primary' | 'success' | 'error';
  actionsLeft?: ReactNode;
}

/** AppModal's action bar: optional content on the left, Cancel + primary submit button on the right. */
export const AppModalActions: FC<AppModalActionsProps> = ({
  onClose,
  hasSave,
  saveLabel,
  cancelLabel,
  saving,
  saveDisabled,
  saveColor,
  actionsLeft,
}) => {
  const { t } = useTranslation();
  return (
    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
      <Box>{actionsLeft}</Box>
      <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
        <Button onClick={onClose} disabled={saving} sx={{ minHeight: 44 }}>
          {cancelLabel ?? t('common.cancel')}
        </Button>
        {hasSave && (
          <Button
            type="submit"
            variant="contained"
            color={saveColor}
            disabled={saving || saveDisabled}
            sx={{ minHeight: 44, minWidth: 104 }}
          >
            {saving ? (
              <CircularProgress size={20} color="inherit" aria-label={t('common.saving')} />
            ) : (
              (saveLabel ?? t('common.save'))
            )}
          </Button>
        )}
      </Box>
    </DialogActions>
  );
};
