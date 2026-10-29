import { useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	Grid,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';
import { studyScheduleService } from '../../services/studySchedule.service';
import type { IStudySchedule } from '../../types/index';
import StudyTimerCard from './StudyTimerCard';
import DurationClockPicker, { type DurationValue } from './DurationClockPicker';

const StudyTimerSection = () => {
	const [timers, setTimers] = useState<IStudySchedule[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState({ title: '', description: '' });
	const [duration, setDuration] = useState<DurationValue>({ hours: 0, minutes: 25, seconds: 0 });
	const [error, setError] = useState('');

	useEffect(() => {
		const load = async () => {
			try {
				const res = await studyScheduleService.getAll({ type: 'timer' });
				const all = res.data ?? [];
				setTimers(all.filter((t) => t.status === 'active' || t.status === 'paused'));
			} catch {
				setError('Failed to load timers.');
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, []);

	const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		const totalSeconds = duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
		if (!form.title.trim()) return setError('Title is required.');
		if (totalSeconds <= 0) return setError('Duration must be greater than 0.');

		setSubmitting(true);
		try {
			const res = await studyScheduleService.createTimer({
				title: form.title.trim(),
				description: form.description.trim(),
				duration: totalSeconds,
			});
			if (res.data) setTimers((prev) => [res.data!, ...prev]);
			setForm({ title: '', description: '' });
			setDuration({ hours: 0, minutes: 25, seconds: 0 });
		} catch {
			setError('Failed to create timer. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleComplete = (id: string) => setTimers((prev) => prev.filter((t) => t._id !== id));
	const handleRemove = (id: string) => setTimers((prev) => prev.filter((t) => t._id !== id));

	return (
		<Grid container spacing={3}>
			{/* Create timer form */}
			<Grid size={{ xs: 12, md: 5 }}>
				<Card variant='outlined'>
					<CardContent>
						<Typography
							variant='h6'
							sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
						>
							<TimerIcon color='primary' />
							New Study Timer
						</Typography>

						<Box component='form' onSubmit={(e) => void handleSubmit(e)}>
							<TextField
								label='Title'
								fullWidth
								required
								value={form.title}
								onChange={handleChange('title')}
								sx={{ mb: 2 }}
								placeholder='e.g. Math Revision'
							/>
							<TextField
								label='Description (optional)'
								fullWidth
								multiline
								rows={2}
								value={form.description}
								onChange={handleChange('description')}
								sx={{ mb: 2 }}
								placeholder='What will you study?'
							/>

							<Typography variant='body2' sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
								Set Duration
							</Typography>

							{/* Clock picker */}
							<Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
								<DurationClockPicker value={duration} onChange={setDuration} />
							</Box>

							{error && (
								<Alert severity='error' sx={{ mb: 2 }}>
									{error}
								</Alert>
							)}

							<Button
								type='submit'
								variant='contained'
								fullWidth
								startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <AddIcon />}
								disabled={submitting}
							>
								{submitting ? 'Creating…' : 'Start Timer'}
							</Button>
						</Box>
					</CardContent>
				</Card>
			</Grid>

			{/* Active timers */}
			<Grid size={{ xs: 12, md: 7 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
					<Typography variant='h6' sx={{ fontWeight: 700 }}>
						Active Timers
					</Typography>
					{timers.length > 0 && (() => {
						const totalSec = timers.reduce((s, t) => s + (t.duration ?? 0), 0);
						const h = Math.floor(totalSec / 3600);
						const m = Math.floor((totalSec % 3600) / 60);
						const s = totalSec % 60;
						return (
							<Typography variant='body2' color='text.secondary'>
								{timers.length} timer{timers.length !== 1 ? 's' : ''} ·{' '}
								<Box
									component='span'
									sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.95rem' }}
								>
									{h > 0 ? `${h}h ` : ''}{m > 0 || h > 0 ? `${m}m ` : ''}{s}s
								</Box>{' '}
								total
							</Typography>
						);
					})()}
				</Box>
				<Divider sx={{ mb: 2 }} />

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
						<CircularProgress />
					</Box>
				) : timers.length === 0 ? (
					<Box
						sx={{
							textAlign: 'center',
							py: 8,
							border: '2px dashed',
							borderColor: 'divider',
							borderRadius: 2,
						}}
					>
						<TimerIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
						<Typography color='text.secondary'>
							No active timers. Create one to get started!
						</Typography>
					</Box>
				) : (
					timers.map((timer) => (
						<StudyTimerCard
							key={timer._id}
							timer={timer}
							onComplete={handleComplete}
							onRemove={handleRemove}
						/>
					))
				)}
			</Grid>
		</Grid>
	);
};

export default StudyTimerSection;
