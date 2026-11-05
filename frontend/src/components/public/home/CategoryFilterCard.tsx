'use client';

import AppsIcon from '@mui/icons-material/Apps';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { localizeDigits } from '@/utils/price';

import { categoryIcon } from './category-icon';

import type { FC } from 'react';

interface CategoryFilterCardProps {
  name: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
  /** The "All" pill: shows the grid icon */
  isAll?: boolean;
}

const PILL_SX = {
  flexShrink: 0,
  minHeight: 56,
  pl: 1.25,
  pr: 1.5,
  py: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  borderRadius: 99,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(15,23,42,0.12)' },
  '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
} as const;
const SELECTED_SX = {
  background: 'linear-gradient(100deg, #0b4fc4 0%, #2563eb 100%)',
  color: 'common.white',
  boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
} as const;
const IDLE_SX = {
  bgcolor: 'common.white',
  color: 'text.primary',
  boxShadow: '0 2px 10px rgba(15,23,42,0.08)',
} as const;
const ICON_SX = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
} as const;
const COUNT_SX = {
  px: 1,
  py: 0.25,
  borderRadius: 99,
  fontSize: '0.8rem',
  fontWeight: 600,
} as const;

/** A category pill in a home course section: icon, name and course count; picking it filters the cards. */
export const CategoryFilterCard: FC<CategoryFilterCardProps> = ({
  name,
  count,
  selected,
  onSelect,
  isAll = false,
}) => {
  const { t, i18n } = useTranslation();
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={{ ...PILL_SX, ...(selected ? SELECTED_SX : IDLE_SX) }}
    >
      <Box
        sx={{
          ...ICON_SX,
          bgcolor: selected ? 'rgba(255,255,255,0.18)' : '#eef2f7',
          color: selected ? 'common.white' : '#1d4ed8',
        }}
        aria-hidden
      >
        {isAll ? <AppsIcon sx={{ fontSize: 20 }} /> : categoryIcon(name)}
      </Box>
      <Typography component="span" sx={{ fontWeight: selected ? 700 : 500, fontSize: '1.05rem' }}>
        {name}
      </Typography>
      <Box
        component="span"
        sx={{
          ...COUNT_SX,
          bgcolor: selected ? 'rgba(255,255,255,0.22)' : '#eef2f7',
          color: selected ? 'common.white' : '#334155',
        }}
      >
        {t('public.home.countShort', { shown: localizeDigits(String(count), i18n.language) })}
      </Box>
    </ButtonBase>
  );
};
