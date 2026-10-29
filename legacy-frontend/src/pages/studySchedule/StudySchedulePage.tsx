import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import StudyTimerSection from './StudyTimerSection';
import StudyReminderSection from './StudyReminderSection';
import StudyHistorySection from './StudyHistorySection';

const StudySchedulePage = () => {
	const [tab, setTab] = useState(0);

	return (
		<Box>
			<Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
				Study Schedule
			</Typography>
			<Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
				Manage your study timers, set reminders, and track your sessions.
			</Typography>

			<Tabs
				value={tab}
				onChange={(_, v: number) => setTab(v)}
				sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
			>
				<Tab icon={<TimerIcon />} iconPosition='start' label='Study Timer' />
				<Tab icon={<EventNoteIcon />} iconPosition='start' label='Reminders' />
				<Tab icon={<HistoryIcon />} iconPosition='start' label='History' />
			</Tabs>

			{tab === 0 && <StudyTimerSection />}
			{tab === 1 && <StudyReminderSection />}
			{tab === 2 && <StudyHistorySection />}
		</Box>
	);
};

export default StudySchedulePage;
