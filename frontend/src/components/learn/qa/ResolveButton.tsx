'use client';

import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ResolveButtonProps {
  isResolved: boolean;
  pending: boolean;
  onClick: () => void;
}

/** "Mark solved" / "Mark not solved". */
export const ResolveButton: FC<ResolveButtonProps> = ({ isResolved, pending, onClick }) => {
  const { t } = useTranslation();
  return (
    <Button
      size="small"
      variant={isResolved ? 'outlined' : 'contained'}
      color={isResolved ? 'inherit' : 'success'}
      startIcon={
        isResolved ? (
          <HelpOutlinedIcon fontSize="small" />
        ) : (
          <CheckCircleOutlinedIcon fontSize="small" />
        )
      }
      disabled={pending}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      sx={{ minHeight: 44, fontWeight: 700 }}
    >
      {t(isResolved ? 'learn.qa.markNotSolved' : 'learn.qa.markSolved')}
    </Button>
  );
};
