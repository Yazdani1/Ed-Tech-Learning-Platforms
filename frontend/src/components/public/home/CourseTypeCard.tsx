'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { coursesHref } from '../common/public-links';

import { gradientAt } from './gradients';

import type { Taxonomy } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface CourseTypeCardProps {
  courseType: Taxonomy;
  index: number;
}

const cardSx = (gradient: string) =>
  ({
    height: '100%',
    minHeight: 210,
    p: 2.75,
    borderRadius: 1,
    border: 1,
    borderColor: 'divider',
    bgcolor: 'background.paper',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'stretch',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: gradient,
      opacity: 0.14,
    },
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 36px rgba(15,23,42,0.11)' },
  }) as const;

/** A learning path (course type): number, gradient name, description, link to its courses. */
export const CourseTypeCard: FC<CourseTypeCardProps> = ({ courseType, index }) => {
  const { t } = useTranslation();
  const gradient = gradientAt(index);
  return (
    <CardActionArea
      component={Link}
      href={coursesHref({ courseTypes: courseType._id })}
      sx={cardSx(gradient)}
    >
      <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Chip
          label={t('public.paths.path', { number: index + 1 })}
          size="small"
          sx={{ fontWeight: 800, mb: 2, alignSelf: 'flex-start' }}
        />
        <Typography
          variant="h4"
          component="h3"
          sx={{
            fontWeight: 900,
            lineHeight: 1.05,
            mb: 1.5,
            background: gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            overflowWrap: 'anywhere',
          }}
        >
          {courseType.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {(courseType.description ?? '').trim() || t('public.paths.fallback')}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 2, color: 'primary.main' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {t('public.paths.explore')}
          </Typography>
          <ArrowForwardIcon aria-hidden sx={{ fontSize: 18 }} />
        </Box>
      </Box>
    </CardActionArea>
  );
};
