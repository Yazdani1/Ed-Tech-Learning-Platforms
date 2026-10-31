'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { QuizStats } from './quiz.utils';
import type { FC } from 'react';

interface QuizStatsBarProps {
  stats: QuizStats;
  /** Accessible name of the block (course progress, bank progress) */
  label: string;
}

const PERCENT = 100;

/** "Total · Answered · Correct · Incorrect · Not answered yet", accuracy and a green/red progress bar. */
export const QuizStatsBar: FC<QuizStatsBarProps> = ({ stats, label }) => {
  const { t } = useTranslation();
  const items = [
    { key: 'total', value: stats.total, color: 'text.primary' },
    { key: 'answered', value: stats.answered, color: 'primary.main' },
    { key: 'correct', value: stats.correct, color: 'success.main' },
    { key: 'incorrect', value: stats.incorrect, color: 'error.main' },
    { key: 'remaining', value: stats.remaining, color: 'warning.main' },
  ];
  const share = (value: number): string =>
    `${stats.total > 0 ? (value / stats.total) * PERCENT : 0}%`;
  return (
    <Paper variant="outlined" role="group" aria-label={label} sx={{ p: 1.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 1 }}>
        {items.map((item) => (
          <Typography
            key={item.key}
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            {t(`learn.quiz.stats.${item.key}`)}:{' '}
            <Box component="span" sx={{ fontWeight: 800, color: item.color }}>
              {item.value}
            </Box>
          </Typography>
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, ml: 'auto' }}>
          {t('learn.quiz.stats.accuracy', { percent: stats.accuracy })}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 6,
          borderRadius: 5,
          bgcolor: 'action.hover',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <Box sx={{ width: share(stats.correct), bgcolor: 'success.main' }} />
        <Box sx={{ width: share(stats.incorrect), bgcolor: 'error.main' }} />
      </Box>
    </Paper>
  );
};
