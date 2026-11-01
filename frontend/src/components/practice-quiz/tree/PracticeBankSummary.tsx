'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { QuizStats } from '@/components/common/quiz/quiz.utils';
import type { QuizBank } from '@/schemas/quiz.schema';

interface PracticeBankSummaryProps {
  bank: QuizBank;
  stats: QuizStats;
  showFreeChip: boolean;
  /** Folded banks show a green/red progress line */
  showProgress: boolean;
  selected: boolean;
}

const PERCENT = 100;

/** Title row of a bank: title, "Free", description, and the progress line while folded. */
export const PracticeBankSummary: FC<PracticeBankSummaryProps> = ({
  bank,
  stats,
  showFreeChip,
  showProgress,
  selected,
}) => {
  const { t } = useTranslation();
  const share = (value: number): string =>
    `${stats.total > 0 ? (value / stats.total) * PERCENT : 0}%`;
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography
          noWrap
          sx={{
            fontWeight: 600,
            fontSize: '0.85rem',
            flex: 1,
            color: selected ? 'primary.main' : 'text.primary',
          }}
        >
          {bank.title}
        </Typography>
        {showFreeChip && <Chip label={t('quiz.practice.tree.free')} size="small" color="success" />}
      </Box>
      {bank.description && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {bank.description}
        </Typography>
      )}
      {showProgress && (
        <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            aria-hidden
            sx={{ flex: 1, height: 4, display: 'flex', bgcolor: 'action.hover', borderRadius: 2 }}
          >
            <Box sx={{ width: share(stats.correct), bgcolor: 'success.main' }} />
            <Box sx={{ width: share(stats.incorrect), bgcolor: 'error.main' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {t('quiz.common.wrongCorrect', { wrong: stats.incorrect, correct: stats.correct })}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
