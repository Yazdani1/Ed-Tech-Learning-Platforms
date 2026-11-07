'use client';

import CloudOffIcon from '@mui/icons-material/CloudOff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { PAGE_TITLE_SX } from '@/components/common/PageHeader';

/** Shown by the installed app when a page cannot load without internet. */
export const OfflinePage = () => {
  const { t } = useTranslation();
  return (
    <Box
      component="main"
      sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', p: 3, textAlign: 'center' }}
    >
      <Box sx={{ maxWidth: 420 }}>
        <CloudOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} aria-hidden />
        <Typography component="h1" sx={{ ...PAGE_TITLE_SX, mb: 1 }}>
          {t('pwa.offlineTitle')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('pwa.offlineText')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            window.location.reload();
          }}
          sx={{ minHeight: 44 }}
        >
          {t('pwa.retry')}
        </Button>
      </Box>
    </Box>
  );
};
