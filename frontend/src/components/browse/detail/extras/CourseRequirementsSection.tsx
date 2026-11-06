'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ICON_TILE_SX, pickByIndex, TILE_COLORS } from '../detail-styles';

import { DetailSection, gridSx } from './DetailSection';
import { requirementIcon } from './requirement-icon';
import { TopBarCard } from './TopBarCard';

import type { FC } from 'react';

interface CourseRequirementsSectionProps {
  items: readonly string[];
}

/** Warm full-width background, different from the grey "What you'll learn" band */
const REQUIREMENTS_BAND = '#fdf4e7';
/** The first card starts on blue */
const COLOR_OFFSET = 1;

/** "Course Requirements": a card per requirement with a colour bar and an icon that fits its text. */
export const CourseRequirementsSection: FC<CourseRequirementsSectionProps> = ({ items }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <DetailSection
      id="course-requirements"
      title={t('browse.detail.requirements')}
      band={REQUIREMENTS_BAND}
    >
      <Box component="ul" sx={gridSx(2, 3)}>
        {items.map((item, index) => {
          const colors = pickByIndex(TILE_COLORS, index + COLOR_OFFSET);
          return (
            <TopBarCard
              key={`${index}-${item}`}
              index={index + COLOR_OFFSET}
              elevated
              sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Box sx={{ ...ICON_TILE_SX, bgcolor: colors.bg, color: colors.fg }}>
                {requirementIcon(item)}
              </Box>
              <Typography
                sx={{ fontWeight: 600, fontSize: '1.1rem', minWidth: 0, overflowWrap: 'anywhere' }}
              >
                {item}
              </Typography>
            </TopBarCard>
          );
        })}
      </Box>
    </DetailSection>
  );
};
