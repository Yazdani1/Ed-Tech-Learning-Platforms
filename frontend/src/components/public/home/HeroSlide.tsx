import Box from '@mui/material/Box';
import Image from 'next/image';

import type { FC } from 'react';

interface HeroSlideProps {
  imageUrl: string;
  active: boolean;
  priority: boolean;
}

/** The slider is never wider than the "lg" container (1200 px) */
const HERO_SIZES = '(max-width: 1200px) 100vw, 1200px';

/** One showcase image; the active one fades in. */
export const HeroSlide: FC<HeroSlideProps> = ({ imageUrl, active, priority }) => (
  <Box
    aria-hidden={!active}
    sx={{
      position: 'absolute',
      inset: 0,
      opacity: active ? 1 : 0,
      transform: active ? 'scale(1)' : 'scale(1.04)',
      transition: 'opacity 0.65s ease, transform 1.1s ease',
    }}
  >
    <Image
      src={imageUrl}
      alt=""
      fill
      sizes={HERO_SIZES}
      priority={priority}
      style={{ objectFit: 'cover' }}
    />
  </Box>
);
