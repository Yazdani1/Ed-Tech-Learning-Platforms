'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { QuizStats, Subsection } from './quiz.utils';
import type { FC } from 'react';

interface SubsectionButtonProps {
  subsection: Subsection;
  /** Questions in this subsection */
  count: number;
  stats: QuizStats;
  selected: boolean;
  onClick: () => void;
}

const PERCENT = 100;
const COLOR: Record<Subsection, 'primary' | 'error' | 'success'> = {
  all: 'primary',
  incorrect: 'error',
  correct: 'success',
};

/** "All", "Wrong" or "Correct" of a bank: count, progress bar and "Wrong n / Correct n". */
export const SubsectionButton: FC<SubsectionButtonProps> = ({
  subsection,
  count,
  stats,
  selected,
  onClick,
}) => {
  const { t } = useTranslation();
  const color = COLOR[subsection];
  const progress = subsection === 'all' ? stats.answered : count;
  const percent = stats.total > 0 ? Math.round((progress / stats.total) * PERCENT) : 0;
  return (
    <Button
      fullWidth
      color={color}
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        display: 'block',
        textAlign: 'left',
        textTransform: 'none',
        color: 'text.primary',
        p: 1,
        border: 1,
        borderColor: selected ? `${color}.main` : 'divider',
        bgcolor: selected ? 'action.selected' : 'background.default',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: selected ? 900 : 700, flex: 1 }}>
          {t(`learn.quiz.subsection.${subsection}`)}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: `${color}.main` }}>
          {count}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent}
        color={color}
        aria-hidden
        sx={{ height: 5, borderRadius: 5, my: 0.65 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
        {t(`learn.quiz.progress.${subsection}`, { done: progress, total: stats.total })}
        {' · '}
        {t('learn.quiz.wrongCorrect', { wrong: stats.incorrect, correct: stats.correct })}
      </Typography>
    </Button>
  );
};
