'use client';

import Box from '@mui/material/Box';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl } from '@/utils/urls';

import { GalleryControls } from './GalleryControls';

import type { FC } from 'react';

const frameSx = {
  position: 'relative',
  height: { xs: 260, md: 460 },
  borderRadius: 1,
  overflow: 'hidden',
  border: 1,
  borderColor: 'divider',
  bgcolor: 'action.hover',
} as const;

interface ImageGalleryProps {
  images: { url: string }[];
  title: string;
}

/** One picture at a time with previous/next buttons and "2 / 5" (discussion and answer pictures). */
export const ImageGallery: FC<ImageGalleryProps> = ({ images, title }) => {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const safe = images.filter((image) => isCloudinaryUrl(image.url));
  const index = Math.min(active, safe.length - 1);
  const current = safe[index];
  if (!current) return null;

  return (
    <Box sx={frameSx}>
      <Image
        src={current.url}
        alt={t('community.images.alt', { title, index: index + 1 })}
        fill
        sizes="(max-width: 900px) 100vw, 800px"
        style={{ objectFit: 'contain' }}
      />
      {safe.length > 1 && (
        <GalleryControls index={index} total={safe.length} onChange={setActive} />
      )}
    </Box>
  );
};
