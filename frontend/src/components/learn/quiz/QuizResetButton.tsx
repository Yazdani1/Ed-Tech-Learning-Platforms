'use client';

import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface QuizResetButtonProps {
  bankTitle: string;
  onReset: () => void;
}

/** "Reset progress for this quiz bank" (asks for confirmation first). */
export const QuizResetButton: FC<QuizResetButtonProps> = ({ bankTitle, onReset }) => {
  const { t } = useTranslation();
  return (
    <Tooltip title={t('learn.quiz.resetBank')}>
      <IconButton
        aria-label={t('learn.quiz.resetBankNamed', { title: bankTitle })}
        onClick={onReset}
        sx={{ width: 44, height: 44, flexShrink: 0 }}
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};
