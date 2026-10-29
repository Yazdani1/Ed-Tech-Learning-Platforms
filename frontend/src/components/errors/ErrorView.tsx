'use client';

import ErrorOutlined from '@mui/icons-material/ErrorOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ErrorViewProps {
  onRetry: () => void;
  /** Next.js error id, shown so a user can quote it when reporting the problem. */
  digest?: string;
}

/** Friendly message for a crashed page, with "Try again" and a full-page link home. */
export const ErrorView: FC<ErrorViewProps> = ({ onRetry, digest }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70dvh', px: 2 }}>
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 480 }}>
        <ErrorOutlined color="error" sx={{ fontSize: 56 }} />
        <Typography component="h1" variant="h5">
          {t('errors.title')}
        </Typography>
        <Typography color="text.secondary">{t('errors.body')}</Typography>
        {digest && (
          <Typography variant="caption" color="text.secondary">
            {t('errors.reference', { digest })}
          </Typography>
        )}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button variant="contained" onClick={onRetry}>
            {t('errors.retry')}
          </Button>
          {/* A plain link (full page load): the app tree may be broken */}
          <Button variant="outlined" href="/">
            {t('errors.goHome')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
