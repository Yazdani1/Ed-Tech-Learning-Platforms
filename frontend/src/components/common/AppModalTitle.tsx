'use client';

import CloseIcon from '@mui/icons-material/Close';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

interface AppModalTitleProps {
  id: string;
  title: ReactNode;
  onClose: () => void;
  disabled: boolean;
}

/** AppModal's title bar with the close icon (44 px touch target). */
export const AppModalTitle: FC<AppModalTitleProps> = ({ id, title, onClose, disabled }) => {
  const { t } = useTranslation();
  return (
    <DialogTitle id={id} sx={{ pr: 7, fontWeight: 800 }}>
      {title}
      <IconButton
        aria-label={t('common.close')}
        onClick={onClose}
        disabled={disabled}
        sx={{ position: 'absolute', top: 8, right: 8, width: 44, height: 44 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>
  );
};
