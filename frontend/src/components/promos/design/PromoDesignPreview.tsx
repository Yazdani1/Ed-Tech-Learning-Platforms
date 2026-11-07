'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface PromoDesignPreviewProps {
  title: string;
  imageUrl: string;
  aspectRatio: string;
  maxWidth: number;
}

/** The saved picture in its real shape, or "Default design in use". */
export const PromoDesignPreview: FC<PromoDesignPreviewProps> = ({
  title,
  imageUrl,
  aspectRatio,
  maxWidth,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth,
        aspectRatio,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'action.hover',
        border: 1,
        borderColor: 'divider',
        display: 'grid',
        placeItems: 'center',
        mb: 2,
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes={`${String(maxWidth)}px`}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('promos.design.defaultInUse')}
        </Typography>
      )}
    </Box>
  );
};
