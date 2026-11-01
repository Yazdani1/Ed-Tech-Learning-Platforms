'use client';

import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface CategoryFilterCardProps {
  name: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}

const MIN_WIDTH = 132;

/** A small category card in a home course section: its name and course count; picking it filters the cards. */
export const CategoryFilterCard: FC<CategoryFilterCardProps> = ({
  name,
  count,
  selected,
  onSelect,
}) => {
  const { t } = useTranslation();
  return (
    <ButtonBase
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        flexShrink: 0,
        minWidth: MIN_WIDTH,
        minHeight: 56,
        px: 2,
        py: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: 1,
        border: 1,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.main' : 'background.paper',
        color: selected ? 'primary.contrastText' : 'text.primary',
        transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 16px rgba(15,23,42,0.08)',
        },
        '@media (prefers-reduced-motion: reduce)': { '&:hover': { transform: 'none' } },
      }}
    >
      <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>
        {name}
      </Typography>
      <Typography
        component="span"
        variant="caption"
        sx={{ color: selected ? 'inherit' : 'text.secondary', opacity: selected ? 0.85 : 1 }}
      >
        {t('public.home.courseCount', { count })}
      </Typography>
    </ButtonBase>
  );
};
