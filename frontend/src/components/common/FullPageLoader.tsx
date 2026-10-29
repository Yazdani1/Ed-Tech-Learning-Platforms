'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

/** Centred spinner while the signed-in user is being checked. */
export const FullPageLoader = () => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60dvh' }}>
      <CircularProgress aria-label={t('common.loading')} />
    </Box>
  );
};
