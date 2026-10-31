'use client';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface LearnLoadErrorProps {
  message: string;
  onRetry: () => void;
}

/** The player could not load (server or network error): the message and "Try again". */
export const LearnLoadError: FC<LearnLoadErrorProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();
  return (
    <Alert
      severity="error"
      sx={{ m: 2 }}
      action={
        <Button color="inherit" onClick={onRetry} sx={{ minHeight: 44 }}>
          {t('common.retry')}
        </Button>
      }
    >
      {message}
    </Alert>
  );
};
