'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

const arrowSx = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 44,
  height: 44,
  bgcolor: 'background.paper',
  '&:hover': { bgcolor: 'background.paper' },
} as const;

const counterSx = {
  position: 'absolute',
  right: 12,
  bottom: 12,
  px: 1,
  borderRadius: 999,
  bgcolor: 'rgba(15,23,42,0.72)',
  color: 'common.white',
  fontSize: 12,
  fontWeight: 800,
} as const;

interface GalleryControlsProps {
  index: number;
  total: number;
  onChange: (index: number) => void;
}

/** Previous/next buttons and the "2 / 5" counter over the gallery picture. */
export const GalleryControls: FC<GalleryControlsProps> = ({ index, total, onChange }) => {
  const { t } = useTranslation();
  return (
    <>
      <IconButton
        aria-label={t('community.images.previous')}
        onClick={() => {
          onChange(index === 0 ? total - 1 : index - 1);
        }}
        sx={{ ...arrowSx, left: 8 }}
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t('community.images.next')}
        onClick={() => {
          onChange((index + 1) % total);
        }}
        sx={{ ...arrowSx, right: 8 }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </IconButton>
      <Box sx={counterSx}>{t('community.images.counter', { current: index + 1, total })}</Box>
    </>
  );
};
