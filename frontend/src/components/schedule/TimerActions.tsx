'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StopIcon from '@mui/icons-material/Stop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import type { TimerCardState } from './useTimerCard';
import type { FC } from 'react';

interface TimerActionsProps {
  state: TimerCardState;
}

const BUTTON_SX = { minHeight: 44 } as const;

/** Pause / Start-Resume, Reset and Stop (Dismiss when done) under a timer's clock. */
export const TimerActions: FC<TimerActionsProps> = ({ state }) => {
  const { t } = useTranslation();
  const { isDone, isRunning, saving } = state;
  let playLabel = t('schedule.timer.start');
  if (isRunning) playLabel = t('schedule.timer.pause');
  else if (state.hasStarted) playLabel = t('schedule.timer.resume');

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      {isDone ? (
        <Chip
          icon={<CheckCircleIcon />}
          label={t('schedule.timer.completedChip')}
          color="success"
          variant="outlined"
        />
      ) : (
        <>
          <Button
            variant="contained"
            color={isRunning ? 'warning' : 'success'}
            startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={isRunning ? state.pause : state.resume}
            disabled={saving}
            sx={BUTTON_SX}
          >
            {playLabel}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={state.reset}
            disabled={saving}
            sx={BUTTON_SX}
          >
            {t('schedule.timer.reset')}
          </Button>
        </>
      )}
      <Button
        variant="outlined"
        color="error"
        startIcon={<StopIcon />}
        onClick={state.stop}
        disabled={saving}
        sx={BUTTON_SX}
      >
        {isDone ? t('schedule.timer.dismiss') : t('schedule.timer.stop')}
      </Button>
    </Box>
  );
};
