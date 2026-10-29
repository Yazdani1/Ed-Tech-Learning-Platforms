'use client';

import SearchOff from '@mui/icons-material/SearchOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export const NotFoundView = () => {
  const { t } = useTranslation();
  return (
    <Box component="main" sx={{ display: 'grid', placeItems: 'center', minHeight: '80dvh', px: 2 }}>
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: 480 }}>
        <SearchOff color="action" sx={{ fontSize: 56 }} />
        <Typography component="h1" variant="h5">
          {t('errors.notFoundTitle')}
        </Typography>
        <Typography color="text.secondary">{t('errors.notFoundBody')}</Typography>
        <Button variant="contained" component={Link} href="/">
          {t('errors.goHome')}
        </Button>
      </Stack>
    </Box>
  );
};
