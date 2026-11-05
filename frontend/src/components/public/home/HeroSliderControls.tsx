'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

/** Class name of the slider box: its hover / keyboard focus reveals the arrows */
export const HERO_SLIDER_CLASS = 'hero-slider';

interface HeroSliderControlsProps {
  count: number;
  active: number;
  onSelect: (index: number) => void;
}

const ARROW_SX = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: { xs: 44, md: 50 },
  height: { xs: 44, md: 50 },
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
  color: 'common.white',
  border: '2px solid rgba(255,255,255,0.85)',
  boxShadow: '0 6px 18px rgba(236,72,153,0.35)',
  '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #db2777 100%)' },
  // Hidden until the pointer is over the slider (or a key focuses an arrow); always shown on touch screens
  opacity: 0,
  transition: 'opacity 0.2s ease',
  [`.${HERO_SLIDER_CLASS}:hover &, .${HERO_SLIDER_CLASS}:focus-within &`]: { opacity: 1 },
  '@media (hover: none)': { opacity: 1 },
} as const;

const DOTS_SX = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 8,
  display: 'flex',
  justifyContent: 'center',
} as const;

/** A 44 px touch target around a small dot (wide and bright when its image is shown). */
const dotSx = (isActive: boolean) =>
  ({
    width: 44,
    height: 44,
    border: 0,
    p: 0,
    bgcolor: 'transparent',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    '&::after': {
      content: '""',
      width: isActive ? 22 : 8,
      height: 8,
      borderRadius: 8,
      bgcolor: isActive ? '#facc15' : 'rgba(250,204,21,0.48)',
      transition: 'width 0.2s ease',
    },
  }) as const;

/** Previous / next arrows (shown on hover) and one dot per image. */
export const HeroSliderControls: FC<HeroSliderControlsProps> = ({ count, active, onSelect }) => {
  const { t } = useTranslation();
  return (
    <>
      <IconButton
        aria-label={t('public.hero.previous')}
        onClick={() => {
          onSelect((active - 1 + count) % count);
        }}
        sx={{ ...ARROW_SX, left: { xs: 12, md: 24 } }}
      >
        <ChevronLeftIcon sx={{ fontSize: 30 }} />
      </IconButton>
      <IconButton
        aria-label={t('public.hero.next')}
        onClick={() => {
          onSelect((active + 1) % count);
        }}
        sx={{ ...ARROW_SX, right: { xs: 12, md: 24 } }}
      >
        <ChevronRightIcon sx={{ fontSize: 30 }} />
      </IconButton>
      <Box sx={DOTS_SX}>
        {Array.from({ length: count }, (_, index) => (
          <Box
            key={index}
            component="button"
            type="button"
            aria-label={t('public.hero.show', { number: index + 1 })}
            aria-current={index === active ? 'true' : undefined}
            onClick={() => {
              onSelect(index);
            }}
            sx={dotSx(index === active)}
          />
        ))}
      </Box>
    </>
  );
};
