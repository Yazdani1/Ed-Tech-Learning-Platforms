'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { useHeroPosts } from '@/api/public.api';
import { isCloudinaryUrl } from '@/utils/urls';

import { HeroSliderControls } from './HeroSliderControls';
import { useHeroAutoplay } from './useHeroAutoplay';

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;
const HERO_HEIGHT = { xs: 320, sm: 380, md: 446 } as const;
/** Shown when no showcase post is public (same blue gradient as the old fallback image). */
const FALLBACK_BACKGROUND =
  'radial-gradient(circle at 14% 42%, rgba(255,255,255,0.18), transparent 45%), linear-gradient(135deg, #0b1f4d 0%, #1b6dc8 56%, #08a5dd 100%)';

/** Full-width slider of the homepage showcase images (changes every 5 s; holds on hover/focus or when paused). */
export const HomeHeroSlider = () => {
  const { t } = useTranslation();
  const { data, isPending } = useHeroPosts();
  const posts = (data ?? []).filter((post) => isCloudinaryUrl(post.imageUrl));
  const { current, select, playing, togglePlaying, holdHandlers } = useHeroAutoplay(posts.length);

  if (isPending) return <Skeleton variant="rectangular" sx={{ height: HERO_HEIGHT }} />;

  return (
    <Box
      component="section"
      aria-roledescription="carousel"
      aria-label={t('public.hero.label')}
      {...holdHandlers}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: HERO_HEIGHT,
        background: FALLBACK_BACKGROUND,
      }}
    >
      {/* The page heading for screen readers: the slider itself is images only */}
      <Typography component="h1" sx={VISUALLY_HIDDEN}>
        {t('common.appName')}
      </Typography>
      {posts.map((post, index) => (
        <Box
          key={post._id}
          aria-hidden={index !== current}
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: index === current ? 1 : 0,
            transform: index === current ? 'scale(1)' : 'scale(1.04)',
            transition: 'opacity 0.65s ease, transform 1.1s ease',
          }}
        >
          <Image
            src={post.imageUrl}
            alt=""
            fill
            sizes="100vw"
            priority={index === 0}
            style={{ objectFit: 'cover' }}
          />
        </Box>
      ))}
      {posts.length > 1 && (
        <HeroSliderControls
          count={posts.length}
          active={current}
          onSelect={select}
          playing={playing}
          onTogglePlaying={togglePlaying}
        />
      )}
    </Box>
  );
};
