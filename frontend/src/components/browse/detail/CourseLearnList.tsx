'use client';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CARD_RADIUS, SOFT_BG, SOFT_BORDER } from './detail-styles';
import { DetailSection, gridSx } from './extras/DetailSection';

import type { FC } from 'react';

interface CourseLearnListProps {
  items: readonly string[];
}

const ITEM_SX = {
  p: { xs: 2, sm: 2.5 },
  display: 'flex',
  gap: 1.5,
  alignItems: 'flex-start',
  bgcolor: SOFT_BG,
  border: `1px solid ${SOFT_BORDER}`,
  borderRadius: CARD_RADIUS,
} as const;

/** "What you'll learn": a soft card with a green tick per item, two per row from tablet width. */
export const CourseLearnList: FC<CourseLearnListProps> = ({ items }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <DetailSection id="course-learn" title={t('browse.detail.whatYouWillLearn')}>
      <Box component="ul" sx={gridSx(2)}>
        {items.map((item, index) => (
          <Box component="li" key={`${index}-${item}`} sx={ITEM_SX}>
            <CheckCircleOutlineIcon sx={{ color: '#059669', flexShrink: 0 }} aria-hidden />
            <Typography sx={{ lineHeight: 1.6, minWidth: 0, overflowWrap: 'anywhere' }}>
              {item}
            </Typography>
          </Box>
        ))}
      </Box>
    </DetailSection>
  );
};
