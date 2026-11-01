'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { Subsection } from '@/components/common/quiz/quiz.utils';

interface PracticeSubsectionTitleProps {
  subsection: Subsection;
  count: number;
}

const BADGE_COLOR: Record<Subsection, string> = {
  all: 'common.black',
  incorrect: 'error.main',
  correct: 'success.main',
};

/** "All Questions (12)" / "Incorrect Questions (3)" / "Correct Questions (9)". */
export const PracticeSubsectionTitle: FC<PracticeSubsectionTitleProps> = ({
  subsection,
  count,
}) => {
  const { t } = useTranslation();
  return (
    <Typography
      component="h3"
      variant="h6"
      sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <Box
        component="span"
        sx={{
          px: 1.25,
          py: 0.25,
          borderRadius: 0.5,
          fontSize: '0.85rem',
          fontWeight: 900,
          color: 'common.white',
          bgcolor: BADGE_COLOR[subsection],
        }}
      >
        {t(`quiz.common.subsectionTitle.${subsection}`)}
      </Box>
      <Box component="span" sx={{ color: 'text.secondary' }}>
        ({count})
      </Box>
    </Typography>
  );
};
