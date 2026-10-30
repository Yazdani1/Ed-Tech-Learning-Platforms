'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { coursesHref } from '../common/public-links';

import { gradientAt } from './gradients';

import type { Taxonomy } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface CategoryCardProps {
  category: Taxonomy;
  index: number;
}

const cardSx = (gradient: string) =>
  ({
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: 1.75,
    minHeight: 118,
    p: 2,
    borderRadius: 1,
    border: 1,
    borderColor: 'divider',
    bgcolor: 'background.paper',
    boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: gradient,
      opacity: 0.12,
    },
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 38px rgba(15,23,42,0.13)' },
  }) as const;

const iconSx = (gradient: string) =>
  ({
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 1,
    flexShrink: 0,
    display: 'grid',
    placeItems: 'center',
    color: 'common.white',
    background: gradient,
  }) as const;

/** A category tile: its initial in a coloured square, its name, and a link to its courses. */
export const CategoryCard: FC<CategoryCardProps> = ({ category, index }) => {
  const { t } = useTranslation();
  const gradient = gradientAt(index);
  return (
    <CardActionArea
      component={Link}
      href={coursesHref({ categories: category._id })}
      sx={cardSx(gradient)}
    >
      <Box aria-hidden sx={iconSx(gradient)}>
        <Typography variant="h5" component="span" sx={{ fontWeight: 900, lineHeight: 1 }}>
          {category.name.trim().charAt(0).toUpperCase()}
        </Typography>
      </Box>
      <Box sx={{ position: 'relative', minWidth: 0, flex: 1 }}>
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            lineHeight: 1.25,
            overflowWrap: 'anywhere',
          }}
        >
          {category.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.75, fontWeight: 600 }}
        >
          {t('public.categories.browse')}
        </Typography>
      </Box>
      <ArrowForwardIcon
        aria-hidden
        sx={{ position: 'relative', color: 'text.secondary', opacity: 0.6 }}
      />
    </CardActionArea>
  );
};
