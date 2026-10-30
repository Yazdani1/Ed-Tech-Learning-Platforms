'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import type { SiteLogo } from '@/schemas/showcase.schema';
import type { FC, ReactNode } from 'react';

interface LogoPreviewProps {
  isLoading: boolean;
  error: Error | null;
  logo: SiteLogo | null;
}

const LOGO_PREVIEW_HEIGHT = 86;
const LOGO_BOX_MIN_HEIGHT = 126;

/** The current site logo in a grey box (or loading / error / "no logo yet"). */
export const LogoPreview: FC<LogoPreviewProps> = ({ isLoading, error, logo }) => {
  const { t } = useTranslation();

  let content: ReactNode;
  if (isLoading) {
    content = <Skeleton variant="rounded" width="70%" height={LOGO_PREVIEW_HEIGHT} />;
  } else if (error) {
    content = <Alert severity="error">{error.message}</Alert>;
  } else if (logo) {
    content = (
      <Box sx={{ position: 'relative', width: '100%', height: LOGO_PREVIEW_HEIGHT }}>
        <Image
          src={logo.imageUrl}
          alt={t('showcase.logo.alt')}
          fill
          sizes="400px"
          style={{ objectFit: 'contain' }}
        />
      </Box>
    );
  } else {
    content = (
      <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
        {t('showcase.logo.none')}
      </Typography>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        minHeight: LOGO_BOX_MIN_HEIGHT,
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {content}
    </Paper>
  );
};
