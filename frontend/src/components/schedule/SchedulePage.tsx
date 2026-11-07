'use client';

import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import TimerIcon from '@mui/icons-material/Timer';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common/PageHeader';

import { HistorySection } from './HistorySection';
import { ReminderAlarmAlert } from './ReminderAlarmAlert';
import { ReminderSection } from './ReminderSection';
import { TimerSection } from './TimerSection';
import { useReminderAlarms } from './useReminderAlarms';

type ScheduleTab = 'timer' | 'reminders' | 'history';

const TAB_SX = { minHeight: 48 } as const;

/**
 * /admin/schedule, /student/schedule, /teacher/schedule: my study timers, reminders and history
 * (every signed-in role; each user only ever sees their own items). Reminder alarms work on every tab.
 */
export const SchedulePage = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ScheduleTab>('timer');
  const alarms = useReminderAlarms();

  return (
    <Box>
      <PageHeader title={t('schedule.title')} />
      <ReminderAlarmAlert title={alarms.alarmTitle} onClose={alarms.dismiss} />
      <Tabs
        value={tab}
        onChange={(_event, value: ScheduleTab) => {
          setTab(value);
        }}
        aria-label={t('schedule.tabs.label')}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab
          value="timer"
          icon={<TimerIcon />}
          iconPosition="start"
          label={t('schedule.tabs.timer')}
          sx={TAB_SX}
        />
        <Tab
          value="reminders"
          icon={<EventNoteIcon />}
          iconPosition="start"
          label={t('schedule.tabs.reminders')}
          sx={TAB_SX}
        />
        <Tab
          value="history"
          icon={<HistoryIcon />}
          iconPosition="start"
          label={t('schedule.tabs.history')}
          sx={TAB_SX}
        />
      </Tabs>
      {tab === 'timer' && <TimerSection />}
      {tab === 'reminders' && <ReminderSection />}
      {tab === 'history' && <HistorySection />}
    </Box>
  );
};
