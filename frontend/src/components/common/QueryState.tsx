'use client';

import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

interface QueryStateProps {
  isLoading: boolean;
  /** The query's error (an ApiError with a message ready to show) */
  error: Error | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  /** Shown when the data loaded but there is nothing to show */
  emptyText?: string;
  emptyAction?: ReactNode;
  /** Skeleton rows while loading */
  skeletonRows?: number;
  children: ReactNode;
}

/** Loading skeleton, error (with retry), empty state, or the content: every async view uses it. */
export const QueryState: FC<QueryStateProps> = ({
  isLoading,
  error,
  isEmpty = false,
  onRetry,
  emptyText,
  emptyAction,
  skeletonRows = 4,
  children,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Stack spacing={1.5} aria-busy="true" aria-label={t('common.loading')}>
        {Array.from({ length: skeletonRows }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry} sx={{ minHeight: 44 }}>
              {t('common.retry')}
            </Button>
          )
        }
      >
        {error.message}
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
        <InboxOutlinedIcon sx={{ fontSize: 48, mb: 1 }} aria-hidden />
        <Typography>{emptyText ?? t('common.empty')}</Typography>
        {emptyAction && <Box sx={{ mt: 2 }}>{emptyAction}</Box>}
      </Box>
    );
  }

  return <>{children}</>;
};
