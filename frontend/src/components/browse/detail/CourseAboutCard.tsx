'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { DISPLAY_FONT } from '@/theme/fonts';
import { hasVisibleText } from '@/utils/html-text';

import { SIDE_CARD_SX } from './detail-styles';
import { FoldableHtml } from './FoldableHtml';

import type { FC } from 'react';

interface CourseAboutCardProps {
  /** Rich text from the course editor (sanitised by SafeHtml) */
  description: string;
}

const BAR = 'linear-gradient(90deg, #2563eb, #7c3aed)';
const HTML_SX = {
  color: '#334155',
  lineHeight: 1.75,
  overflowWrap: 'anywhere',
  '& p': { mt: 0, mb: 2 },
  '& ul, & ol': { pl: 3 },
  '& h1, & h2, & h3': { fontFamily: DISPLAY_FONT, color: '#0f172a', lineHeight: 1.3, mb: 2 },
} as const;

/**
 * "About this course" (rich text) beside the enrolment card: a long text shows its first lines with a fade and
 * "Show more"; hidden when there is no description.
 */
export const CourseAboutCard: FC<CourseAboutCardProps> = ({ description }) => {
  const { t } = useTranslation();
  if (!hasVisibleText(description)) return null;
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby="course-about-heading"
      sx={SIDE_CARD_SX}
    >
      <Box sx={{ height: 6, background: BAR }} />
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography
          id="course-about-heading"
          component="h2"
          sx={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '1.85rem' },
            mb: 2,
          }}
        >
          {t('browse.detail.about')}
        </Typography>
        <FoldableHtml html={description} id="course-about-body" htmlSx={HTML_SX} />
      </Box>
    </Paper>
  );
};
