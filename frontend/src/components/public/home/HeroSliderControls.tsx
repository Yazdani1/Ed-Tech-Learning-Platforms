'use client';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface HeroSliderControlsProps {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  playing: boolean;
  onTogglePlaying: () => void;
}

const ARROW_SX = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: { xs: 44, md: 50 },
  height: { xs: 44, md: 50 },
  bgcolor: '#0ea5e9',
  color: 'common.white',
  border: '2px solid rgba(255,255,255,0.8)',
  '&:hover': { bgcolor: '#0369a1' },
} as const;

const PLAY_SX = {
  position: 'absolute',
  right: { xs: 8, md: 16 },
  bottom: 8,
  width: 44,
  height: 44,
  color: 'common.white',
  bgcolor: 'rgba(15,23,42,0.45)',
  '&:hover': { bgcolor: 'rgba(15,23,42,0.65)' },
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

/** Previous / next arrows, one dot per image and pause / play. */
export const HeroSliderControls: FC<HeroSliderControlsProps> = ({
  count,
  active,
  onSelect,
  playing,
  onTogglePlaying,
}) => {
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
      <IconButton
        aria-label={playing ? t('public.hero.pause') : t('public.hero.play')}
        onClick={onTogglePlaying}
        sx={PLAY_SX}
      >
        {playing ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
    </>
  );
};
