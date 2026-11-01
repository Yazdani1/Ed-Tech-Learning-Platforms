'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { useTranslation } from 'react-i18next';

import { DigitalClock } from './DigitalClock';
import { ScheduleCardHeading } from './ScheduleCardHeading';
import { DONE_TONE, RUNNING_TONE } from './schedule.theme';
import { TimerActions } from './TimerActions';
import { useTimerCard } from './useTimerCard';

import type { Schedule } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface TimerCardProps {
  timer: Schedule;
}

type TimerLook = 'done' | 'running' | 'paused';

const BORDER: Record<TimerLook, string> = {
  done: 'error.light',
  running: 'success.light',
  paused: 'divider',
};
const CHIP: Record<TimerLook, 'error' | 'success' | 'default'> = {
  done: 'error',
  running: 'success',
  paused: 'default',
};
const LABEL_KEY: Record<TimerLook, string> = {
  done: 'schedule.timer.statusCompleted',
  running: 'schedule.timer.statusRunning',
  paused: 'schedule.timer.statusPaused',
};

/** One active or paused timer: title, status, a big countdown clock, progress bar and actions. */
export const TimerCard: FC<TimerCardProps> = ({ timer }) => {
  const { t } = useTranslation();
  const state = useTimerCard(timer);
  let look: TimerLook = 'paused';
  if (state.isDone) look = 'done';
  else if (state.isRunning) look = 'running';
  const tone = state.isDone ? DONE_TONE : RUNNING_TONE;

  return (
    <Card
      component="article"
      aria-label={timer.title}
      variant="outlined"
      sx={{ mb: 2, borderColor: BORDER[look], transition: 'border-color 0.3s' }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <ScheduleCardHeading title={timer.title} description={timer.description} />
          <Chip
            label={t(LABEL_KEY[look])}
            size="small"
            color={CHIP[look]}
            sx={{ fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}
          />
        </Box>
        <Box sx={{ my: 2 }}>
          <DigitalClock
            seconds={state.remaining}
            label={t('schedule.timer.timeLeft')}
            tone={tone}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={state.progress}
          aria-label={t('schedule.timer.progress')}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 2,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { background: tone.bar, borderRadius: 3 },
          }}
        />
        <TimerActions state={state} />
      </CardContent>
    </Card>
  );
};
