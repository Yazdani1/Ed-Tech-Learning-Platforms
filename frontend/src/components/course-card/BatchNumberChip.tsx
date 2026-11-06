'use client';

import TagIcon from '@mui/icons-material/Tag';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { localizeDigits } from '@/utils/price';

import type { FC } from 'react';

interface BatchNumberChipProps {
  batchNumber: string | null | undefined;
  /** "light" on white cards, "dark" on the course page banner */
  tone?: 'light' | 'dark';
}

const BASE_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1.25,
  py: 0.5,
  borderRadius: 99,
  fontSize: '0.8rem',
  fontWeight: 700,
  whiteSpace: 'nowrap',
  flexShrink: 0,
} as const;
const TONES = {
  light: { bgcolor: '#eef2ff', color: '#3730a3' },
  dark: {
    bgcolor: 'rgba(245,158,11,0.22)',
    border: '1px solid rgba(251,191,36,0.55)',
    color: '#fde68a',
    textTransform: 'uppercase',
  },
} as const;

/** "Batch 1234" of a course (nothing when the course has no batch number). */
export const BatchNumberChip: FC<BatchNumberChipProps> = ({ batchNumber, tone = 'light' }) => {
  const { t, i18n } = useTranslation();
  if (!batchNumber) return null;
  return (
    <Box component="span" sx={{ ...BASE_SX, ...TONES[tone] }}>
      <TagIcon sx={{ fontSize: 15 }} aria-hidden />
      {localizeDigits(t('public.courses.batch', { number: batchNumber }), i18n.language)}
    </Box>
  );
};
