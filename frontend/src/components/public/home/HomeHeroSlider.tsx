'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useHeroPosts } from '@/api/public.api';
import { isCloudinaryUrl } from '@/utils/urls';

import { HeroSlide } from './HeroSlide';
import { HERO_SLIDER_CLASS, HeroSliderControls } from './HeroSliderControls';
import { useHeroAutoplay } from './useHeroAutoplay';

const VISUALLY_HIDDEN = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const;
const HERO_HEIGHT = { xs: 220, sm: 320, md: 420 } as const;
const HERO_RADIUS = 2;
/** Shown when no showcase post is public (same blue gradient as the old fallback image). */
const FALLBACK_BACKGROUND =
  'radial-gradient(circle at 14% 42%, rgba(255,255,255,0.18), transparent 45%), linear-gradient(135deg, #0b1f4d 0%, #1b6dc8 56%, #08a5dd 100%)';

/** Container-width slider of the homepage showcase images (changes every 5 s; holds on hover/focus; arrows appear on hover). */
export const HomeHeroSlider = () => {
  const { t } = useTranslation();
  const { data, isPending } = useHeroPosts();
  const posts = (data ?? []).filter((post) => isCloudinaryUrl(post.imageUrl));
  const { current, select, holdHandlers } = useHeroAutoplay(posts.length);

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>
      {isPending ? (
        <Skeleton variant="rounded" sx={{ height: HERO_HEIGHT, borderRadius: HERO_RADIUS }} />
      ) : (
        <Box
          component="section"
          aria-roledescription="carousel"
          aria-label={t('public.hero.label')}
          className={HERO_SLIDER_CLASS}
          {...holdHandlers}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            height: HERO_HEIGHT,
            borderRadius: HERO_RADIUS,
            background: FALLBACK_BACKGROUND,
          }}
        >
          {/* The page heading for screen readers: the slider itself is images only */}
          <Typography component="h1" sx={VISUALLY_HIDDEN}>
            {t('common.appName')}
          </Typography>
          {posts.map((post, index) => (
            <HeroSlide
              key={post._id}
              imageUrl={post.imageUrl}
              title={post.title}
              description={post.description}
              active={index === current}
              priority={index === 0}
            />
          ))}
          {posts.length > 1 && (
            <HeroSliderControls count={posts.length} active={current} onSelect={select} />
          )}
        </Box>
      )}
    </Container>
  );
};
