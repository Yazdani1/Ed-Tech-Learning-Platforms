'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useSchedules } from '@/api/schedule.api';
import { QueryState } from '@/components/common/QueryState';

import { isOpenTimer } from './schedule.utils';
import { TimerCard } from './TimerCard';
import { TimerForm } from './TimerForm';
import { useDurationText } from './useDurationText';

/** "Study Timer" tab: the create form and my active / paused timers. */
export const TimerSection = () => {
  const { t } = useTranslation();
  const durationText = useDurationText();
  const query = useSchedules({ type: 'timer' });
  const timers = (query.data ?? []).filter(isOpenTimer);
  const totalSeconds = timers.reduce((sum, timer) => sum + (timer.duration ?? 0), 0);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <TimerForm />
      </Grid>
      <Grid size={{ xs: 12, md: 7 }} component="section" aria-labelledby="active-timers-heading">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
          }}
        >
          <Typography
            id="active-timers-heading"
            component="h2"
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            {t('schedule.timer.activeTitle')}
          </Typography>
          {timers.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('schedule.timer.summary', {
                count: timers.length,
                total: durationText(totalSeconds),
              })}
            </Typography>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <QueryState
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={timers.length === 0}
          emptyText={t('schedule.timer.empty')}
        >
          {timers.map((timer) => (
            <TimerCard key={timer._id} timer={timer} />
          ))}
        </QueryState>
      </Grid>
    </Grid>
  );
};
