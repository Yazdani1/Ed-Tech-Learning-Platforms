'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useSchedules } from '@/api/schedule.api';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { ReminderCard } from './ReminderCard';
import { ReminderEditModal } from './ReminderEditModal';
import { ReminderForm } from './ReminderForm';
import { formatClock, isOpenReminder, reminderStudySeconds } from './schedule.utils';
import { useNow } from './useNow';

import type { Schedule } from '@/schemas/schedule.schema';

/** "Reminders" tab: the create form and my upcoming / active reminders. */
export const ReminderSection = () => {
  const { t } = useTranslation();
  const query = useSchedules({ type: 'reminder' });
  const editModal = useModal<Schedule>();
  const reminders = (query.data ?? []).filter(isOpenReminder);
  const active = reminders.filter((item) => item.status === 'active' && item.firedAt);
  const now = useNow(active.length > 0);
  const studied = active.reduce((sum, item) => sum + reminderStudySeconds(item, now), 0);

  return (
    <>
      <ReminderEditModal
        open={editModal.open}
        reminder={editModal.data}
        onClose={editModal.closeModal}
      />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ReminderForm />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }} component="section" aria-labelledby="reminders-heading">
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
            <Typography id="reminders-heading" component="h2" variant="h6" sx={{ fontWeight: 700 }}>
              {t('schedule.reminder.listTitle')}
            </Typography>
            {active.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {t('schedule.reminder.activeSummary', {
                  count: active.length,
                  time: formatClock(studied),
                })}
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
          <QueryState
            isLoading={query.isLoading}
            error={query.error}
            onRetry={() => void query.refetch()}
            isEmpty={reminders.length === 0}
            emptyText={t('schedule.reminder.empty')}
          >
            {reminders.map((reminder) => (
              <ReminderCard key={reminder._id} reminder={reminder} onEdit={editModal.openModal} />
            ))}
          </QueryState>
        </Grid>
      </Grid>
    </>
  );
};
