'use client';

import EventNoteIcon from '@mui/icons-material/EventNote';
import TimerIcon from '@mui/icons-material/Timer';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useTranslation } from 'react-i18next';

import type { ScheduleType } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface HistoryTypeTabsProps {
  value: ScheduleType;
  timerCount: number;
  reminderCount: number;
  onChange: (type: ScheduleType) => void;
}

const TAB_SX = { minHeight: 48 } as const;

/** "Timers (n)" / "Reminders (n)": the type filter of the history tab. */
export const HistoryTypeTabs: FC<HistoryTypeTabsProps> = ({
  value,
  timerCount,
  reminderCount,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <Tabs
      value={value}
      onChange={(_event, next: ScheduleType) => {
        onChange(next);
      }}
      aria-label={t('schedule.history.tabsLabel')}
      variant="scrollable"
      allowScrollButtonsMobile
      sx={{ mb: 3 }}
    >
      <Tab
        value="timer"
        icon={<TimerIcon />}
        iconPosition="start"
        label={t('schedule.history.timersTab', { count: timerCount })}
        sx={TAB_SX}
      />
      <Tab
        value="reminder"
        icon={<EventNoteIcon />}
        iconPosition="start"
        label={t('schedule.history.remindersTab', { count: reminderCount })}
        sx={TAB_SX}
      />
    </Tabs>
  );
};
