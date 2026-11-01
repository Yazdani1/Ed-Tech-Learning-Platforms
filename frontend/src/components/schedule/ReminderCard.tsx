'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { EditDeleteMenu } from '@/components/common/EditDeleteMenu';

import { ReminderCountdown } from './ReminderCountdown';
import { ReminderDates } from './ReminderDates';
import { ReminderStudyPanel } from './ReminderStudyPanel';
import { ScheduleCardHeading } from './ScheduleCardHeading';
import { reminderStudySeconds, secondsUntilStart } from './schedule.utils';
import { useNow } from './useNow';
import { useReminderActions } from './useReminderActions';

import type { Schedule } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface ReminderCardProps {
  reminder: Schedule;
  onEdit: (reminder: Schedule) => void;
}

/** One reminder: upcoming (countdown to the start) or active (study stopwatch + Complete Session). */
export const ReminderCard: FC<ReminderCardProps> = ({ reminder, onEdit }) => {
  const { t } = useTranslation();
  const now = useNow();
  const actions = useReminderActions(reminder);
  const isActive = reminder.status === 'active';
  const countdown = secondsUntilStart(reminder, now);

  return (
    <Card
      component="article"
      aria-label={reminder.title}
      variant="outlined"
      sx={{
        mb: 2,
        borderColor: isActive ? 'warning.main' : 'divider',
        borderWidth: isActive ? 2 : 1,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <ScheduleCardHeading title={reminder.title} description={reminder.description} />
          {!isActive && countdown > 0 && <ReminderCountdown seconds={countdown} />}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={
                isActive
                  ? t('schedule.reminder.statusActive')
                  : t('schedule.reminder.statusUpcoming')
              }
              size="small"
              color={isActive ? 'warning' : 'default'}
              sx={{ fontWeight: 700, letterSpacing: 0.8 }}
            />
            <EditDeleteMenu
              label={t('schedule.reminder.actionsFor', { title: reminder.title })}
              editLabel={t('schedule.reminder.edit')}
              onEdit={() => {
                onEdit(reminder);
              }}
              onDelete={actions.askDelete}
            />
          </Box>
        </Box>
        <ReminderDates reminder={reminder} />
        {isActive && (
          <ReminderStudyPanel seconds={reminderStudySeconds(reminder, now)} actions={actions} />
        )}
      </CardContent>
    </Card>
  );
};
