import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import type { FC } from 'react';

interface HeroSlideProps {
  imageUrl: string;
  /** Optional caption set on the Homepage Showcase page */
  title?: string | null;
  description?: string | null;
  active: boolean;
  priority: boolean;
}

/** The slider is never wider than the "lg" container (1200 px) */
const HERO_SIZES = '(max-width: 1200px) 100vw, 1200px';

const CAPTION_SX = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  px: { xs: 2, md: 5 },
  pt: { xs: 4, md: 8 },
  pb: { xs: 5, md: 6 },
  color: 'common.white',
  background: 'linear-gradient(to top, rgba(15,23,42,0.78), rgba(15,23,42,0))',
} as const;

/** One showcase image (with its title and description, when set); the active one fades in. */
export const HeroSlide: FC<HeroSlideProps> = ({
  imageUrl,
  title,
  description,
  active,
  priority,
}) => (
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
    {[title, description].some(Boolean) && (
      <Box sx={CAPTION_SX}>
        {title && (
          <Typography
            component="p"
            sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', md: '1.75rem' }, lineHeight: 1.25 }}
          >
            {title}
          </Typography>
        )}
        {description && (
          <Typography
            sx={{
              mt: 0.5,
              opacity: 0.9,
              maxWidth: 720,
              fontSize: { xs: '0.85rem', md: '1rem' },
              display: { xs: '-webkit-box' },
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
    )}
  </Box>
);
