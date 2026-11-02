import Box from '@mui/material/Box';
import Image from 'next/image';

import { isCloudinaryUrl } from '@/utils/urls';

import type { SxProps, Theme } from '@mui/material/styles';
import type { FC } from 'react';

type FlatSx = Exclude<SxProps<Theme>, readonly unknown[]>;

interface CloudImageProps {
  url: string;
  /** '' for decorative pictures (the text next to them says what they are) */
  alt: string;
  /** The `sizes` hint for next/image (e.g. '(max-width: 600px) 100vw, 400px') */
  sizes: string;
  /** cover crops to fill the box; contain shows the whole picture */
  fit?: 'cover' | 'contain';
  /** Size and shape of the box the picture fills (width / height / aspectRatio, radius, ...) */
  sx?: FlatSx;
}

/** An uploaded (Cloudinary) picture filling its box through next/image; nothing for other addresses. */
export const CloudImage: FC<CloudImageProps> = ({ url, alt, sizes, fit = 'cover', sx }) => (
  <Box sx={[{ position: 'relative', overflow: 'hidden', flexShrink: 0 }, sx ?? false]}>
    {isCloudinaryUrl(url) && (
      <Image src={url} alt={alt} fill sizes={sizes} style={{ objectFit: fit }} />
    )}
  </Box>
);
