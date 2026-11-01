'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl } from '@/utils/urls';

import type { FC } from 'react';

/** Thumbnails shown on a hub card; the rest are counted ("+3"). */
const MAX_THUMBNAILS = 4;
const THUMB_WIDTH = 116;
const THUMB_HEIGHT = 82;

interface ImageThumbnailsProps {
  images: { url: string }[];
  title: string;
}

/** Small previews of a discussion's pictures on the hub list. */
export const ImageThumbnails: FC<ImageThumbnailsProps> = ({ images, title }) => {
  const { t } = useTranslation();
  const safe = images.filter((image) => isCloudinaryUrl(image.url));
  if (safe.length === 0) return null;
  const hidden = safe.length - MAX_THUMBNAILS;
  const box = {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: 1,
    border: 1,
    borderColor: 'divider',
  };

  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
      {safe.slice(0, MAX_THUMBNAILS).map((image, index) => (
        <Box
          key={`${image.url}-${index}`}
          sx={{ ...box, position: 'relative', overflow: 'hidden' }}
        >
          <Image
            src={image.url}
            alt={t('community.images.alt', { title, index: index + 1 })}
            fill
            sizes={`${THUMB_WIDTH}px`}
            style={{ objectFit: 'cover' }}
          />
        </Box>
      ))}
      {hidden > 0 && (
        <Box
          sx={{
            ...box,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
            fontWeight: 800,
          }}
        >
          {t('community.images.more', { count: hidden })}
        </Box>
      )}
    </Stack>
  );
};
