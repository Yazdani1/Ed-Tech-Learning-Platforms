'use client';

import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

import { DigitalClock } from './DigitalClock';

import type { ReminderActions } from './useReminderActions';
import type { FC } from 'react';

interface ReminderStudyPanelProps {
  seconds: number;
  actions: ReminderActions;
}

/** Active reminder: the study stopwatch and the "Complete Session" button. */
export const ReminderStudyPanel: FC<ReminderStudyPanelProps> = ({ seconds, actions }) => {
  const { t } = useTranslation();
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
        <DigitalClock
          seconds={seconds}
          label={t('schedule.reminder.studyTime')}
          caption={t('schedule.reminder.studyTime').toUpperCase()}
          size="medium"
        />
      </Box>
      <Button
        variant="contained"
        color="warning"
        onClick={actions.complete}
        disabled={actions.busy}
        startIcon={
          actions.completing ? <CircularProgress size={14} color="inherit" /> : <CheckIcon />
        }
        sx={{ minHeight: 44 }}
      >
        {t('schedule.reminder.complete')}
      </Button>
    </>
  );
};
