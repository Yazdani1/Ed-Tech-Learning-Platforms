'use client';

import SchoolIcon from '@mui/icons-material/School';
import Box from '@mui/material/Box';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { isCloudinaryUrl } from '@/utils/urls';

import type { FC } from 'react';

/** Height of the cover on every course card. */
export const CARD_COVER_HEIGHT = 175;
const CARD_COVER_SIZES = '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw';

interface CourseCoverProps {
  src: string | null | undefined;
  /** The course title; empty when the picture is decorative (the title is shown next to it) */
  alt: string;
  height?: number | string;
  /** Sizes hint for next/image (how wide the picture is shown) */
  sizes?: string;
  priority?: boolean;
}

/** A course cover picture (Cloudinary only), or a neutral placeholder when there is none. */
export const CourseCover: FC<CourseCoverProps> = ({
  src,
  alt,
  height = CARD_COVER_HEIGHT,
  sizes = CARD_COVER_SIZES,
  priority = false,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ position: 'relative', width: '100%', height, bgcolor: 'grey.100', flexShrink: 0 }}>
      {isCloudinaryUrl(src) ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          role={alt ? 'img' : undefined}
          aria-label={alt ? t('common.noCoverImage') : undefined}
          aria-hidden={alt ? undefined : true}
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'grey.400',
          }}
        >
          <SchoolIcon sx={{ fontSize: 56 }} />
        </Box>
      )}
    </Box>
  );
};
