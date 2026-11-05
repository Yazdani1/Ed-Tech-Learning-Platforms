'use client';

import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CARD_RADIUS, SOFT_BG, SOFT_BORDER } from '../detail-styles';

import { DetailSection, gridSx } from './DetailSection';

import type { FC } from 'react';

interface CourseAudienceSectionProps {
  items: readonly string[];
}

const ITEM_SX = {
  p: 2.5,
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  bgcolor: SOFT_BG,
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: CARD_RADIUS,
} as const;

/** "Who this course is for": one card per item. */
export const CourseAudienceSection: FC<CourseAudienceSectionProps> = ({ items }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <DetailSection id="course-audience" title={t('browse.extras.audienceTitle')}>
      <Box component="ul" sx={gridSx(2)}>
        {items.map((item, index) => (
          <Box component="li" key={`${index}-${item}`} sx={ITEM_SX}>
            <PersonOutlineIcon color="primary" aria-hidden />
            <Typography sx={{ fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </DetailSection>
  );
};
