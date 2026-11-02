'use client';

import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DetailSection, gridSx } from './DetailSection';

import type { FC } from 'react';

interface CourseAudienceSectionProps {
  items: readonly string[];
}

/** "Who this course is for": one card per item. */
export const CourseAudienceSection: FC<CourseAudienceSectionProps> = ({ items }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <DetailSection id="course-audience" title={t('browse.extras.audienceTitle')}>
      <Box component="ul" sx={gridSx(2)}>
        {items.map((item, index) => (
          <Paper
            component="li"
            key={`${index}-${item}`}
            variant="outlined"
            sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 2 }}
          >
            <PersonOutlineIcon color="primary" aria-hidden />
            <Typography sx={{ fontWeight: 600 }}>{item}</Typography>
          </Paper>
        ))}
      </Box>
    </DetailSection>
  );
};
