import { type FC, useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Snackbar,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AlarmIcon from '@mui/icons-material/Alarm';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AppModal from '../../components/common/AppModal';
import DestructiveActionConfirmModal from '../../components/common/DestructiveActionConfirmModal';
import { studyScheduleService } from '../../services/studySchedule.service';
import type { IStudySchedule } from '../../types/index';
import { formatSeconds, playAlarm } from '../../utils/alarm';

/* ── helpers ─────────────────────────────────────────────────────────────── */

const fmtDatetime = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });


/* ── ReminderCard ────────────────────────────────────────────────────────── */

interface ReminderCardProps {
	reminder: IStudySchedule;
	onComplete: (id: string) => void;
	onDelete: (id: string) => void;
	onEdit: (r: IStudySchedule) => void;
}

const ReminderCard: FC<ReminderCardProps> = ({ reminder, onComplete, onDelete, onEdit }) => {
	const isActive = reminder.status === 'active';

	const initialElapsed = reminder.firedAt
		? Math.max(0, Math.floor((Date.now() - new Date(reminder.firedAt).getTime()) / 1000))
		: 0;
	const [elapsed, setElapsed] = useState(initialElapsed);
	const [countdown, setCountdown] = useState(0);
	const [completing, setCompleting] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

	/* stopwatch – counts UP when active */
	useEffect(() => {
		if (!isActive) return;
		const iv = setInterval(() => setElapsed((e) => e + 1), 1000);
		return () => clearInterval(iv);
	}, [isActive]);

	/* countdown to start – counts DOWN when pending */
	useEffect(() => {
		if (isActive || !reminder.startDateTime) return;
		const update = () => {
			const diff = Math.max(
				0,
				Math.floor((new Date(reminder.startDateTime!).getTime() - Date.now()) / 1000),
			);
			setCountdown(diff);
		};
		update();
		const iv = setInterval(update, 1000);
		return () => clearInterval(iv);
	}, [isActive, reminder.startDateTime]);

	const handleComplete = async () => {
		setCompleting(true);
		try {
			await studyScheduleService.update(reminder._id, { status: 'completed' });
			onComplete(reminder._id);
		} finally {
			setCompleting(false);
		}
	};

	const handleDeleteConfirm = async () => {
		setDeleting(true);
		try {
			await studyScheduleService.delete(reminder._id);
			onDelete(reminder._id);
		} finally {
			setDeleting(false);
			setDeleteOpen(false);
		}
	};

	return (
		<>
			<Card
				variant='outlined'
				sx={{
					mb: 2,
					borderColor: isActive ? 'warning.main' : 'divider',
					borderWidth: isActive ? 2 : 1,
					transition: 'border-color 0.3s',
				}}
			>
				<CardContent sx={{ pb: '12px !important' }}>
					{/* Header */}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, position: 'relative' }}>
						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography variant='h6' sx={{ fontWeight: 700, lineHeight: 1.3 }}>
								{reminder.title}
							</Typography>
							{reminder.description && (
								<Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
									{reminder.description}
								</Typography>
							)}
						</Box>

						{/* Countdown clock — absolutely centered in the row */}
						{!isActive && countdown > 0 && (
							<Box
								sx={{
									position: 'absolute',
									left: '50%',
									transform: 'translateX(-50%)',
									display: 'inline-flex',
									flexDirection: 'column',
									alignItems: 'center',
									background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
									borderRadius: 1.5,
									px: 1.5,
									py: 0.5,
									border: '1px solid rgba(0,230,118,0.25)',
									boxShadow: '0 0 10px rgba(0,230,118,0.08)',
									pointerEvents: 'none',
								}}
							>
								<Typography sx={{ color: '#00e676', fontSize: 7, letterSpacing: 1.5, lineHeight: 1.2 }}>
									STARTS IN
								</Typography>
								<Typography
									sx={{
										fontFamily: '"Courier New", Courier, monospace',
										fontSize: '0.85rem',
										fontWeight: 700,
										color: '#00e676',
										textShadow: '0 0 8px rgba(0,230,118,0.5)',
										letterSpacing: '0.06em',
										lineHeight: 1.1,
									}}
								>
									{formatSeconds(countdown)}
								</Typography>
							</Box>
						)}

						<Chip
							label={isActive ? 'ACTIVE' : 'UPCOMING'}
							size='small'
							color={isActive ? 'warning' : 'default'}
							sx={{ fontWeight: 700, letterSpacing: 0.8, flexShrink: 0 }}
						/>
						<IconButton
							size='small'
							onClick={(e) => setMenuAnchor(e.currentTarget)}
							disabled={completing || deleting}
						>
							<MoreVertIcon fontSize='small' />
						</IconButton>
						<Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
							<MenuItem
								onClick={() => {
									setMenuAnchor(null);
									onEdit(reminder);
								}}
							>
								<ListItemIcon><EditIcon fontSize='small' /></ListItemIcon>
								<ListItemText>Edit reminder</ListItemText>
							</MenuItem>
							<MenuItem
								onClick={() => {
									setMenuAnchor(null);
									setDeleteOpen(true);
								}}
								sx={{ color: 'error.main' }}
							>
								<ListItemIcon><DeleteIcon fontSize='small' color='error' /></ListItemIcon>
								<ListItemText>Delete</ListItemText>
							</MenuItem>
						</Menu>
					</Box>

					{/* Date info — left-aligned */}
					<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 0.75 }}>
						<Typography variant='caption' color='text.secondary'>
							<strong>Starts:</strong> {fmtDatetime(reminder.startDateTime!)}
						</Typography>
						{reminder.endDateTime && (
							<Typography variant='caption' color='text.secondary'>
								<strong>Ends:</strong> {fmtDatetime(reminder.endDateTime)}
							</Typography>
						)}
					</Box>


					{/* Study stopwatch — digital clock style, smaller + centered */}
					{isActive && (
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1.5 }}>
							<Box
								sx={{
									background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
									borderRadius: 2,
									py: 1.5,
									px: 3,
									textAlign: 'center',
									border: '1px solid rgba(0,230,118,0.2)',
									boxShadow: '0 0 18px rgba(0,230,118,0.08)',
									minWidth: 200,
								}}
							>
								<Typography
									variant='caption'
									sx={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 2, display: 'block', mb: 0.25 }}
								>
									STUDY TIME
								</Typography>
								<Typography
									sx={{
										fontFamily: '"Courier New", Courier, monospace',
										fontSize: '1.7rem',
										fontWeight: 700,
										color: '#00e676',
										textShadow: '0 0 12px rgba(0,230,118,0.45)',
										letterSpacing: '0.08em',
										lineHeight: 1,
									}}
								>
									{formatSeconds(elapsed)}
								</Typography>
								<Box sx={{ display: 'flex', justifyContent: 'center', gap: 2.5, mt: 0.5 }}>
									{['HH', 'MM', 'SS'].map((l) => (
										<Typography
											key={l}
											variant='caption'
											sx={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: 9, letterSpacing: 1.5 }}
										>
											{l}
										</Typography>
									))}
								</Box>
							</Box>
						</Box>
					)}

					{/* Complete button */}
					{isActive && (
						<Button
							variant='contained'
							color='warning'
							size='small'
							startIcon={completing ? <CircularProgress size={14} color='inherit' /> : <CheckIcon />}
							onClick={() => void handleComplete()}
							disabled={completing}
						>
							Complete Session
						</Button>
					)}
				</CardContent>
			</Card>

			{/* Delete confirmation */}
			<DestructiveActionConfirmModal
				open={deleteOpen}
				onClose={() => setDeleteOpen(false)}
				onConfirm={() => void handleDeleteConfirm()}
				title='Delete Reminder'
				confirmText='Delete'
				confirming={deleting}
				maxWidth='xs'
			>
				{`Delete "${reminder.title}"? This cannot be undone.`}
			</DestructiveActionConfirmModal>
		</>
	);
};

/* ── Edit dialog via AppModal ────────────────────────────────────────────── */

interface EditDialogProps {
	reminder: IStudySchedule | null;
	onClose: () => void;
	onSaved: (updated: IStudySchedule) => void;
}

const EditDialog: FC<EditDialogProps> = ({ reminder, onClose, onSaved }) => {
	const [form, setForm] = useState({ title: '', description: '', startDateTime: '', endDateTime: '' });
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!reminder) return;
		setError('');
		setForm({
			title: reminder.title,
			description: reminder.description,
			startDateTime: reminder.startDateTime
				? new Date(reminder.startDateTime).toISOString().slice(0, 16)
				: '',
			endDateTime: reminder.endDateTime
				? new Date(reminder.endDateTime).toISOString().slice(0, 16)
				: '',
		});
	}, [reminder]);

	const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((p) => ({ ...p, [field]: e.target.value }));

	const handleSave = async () => {
		setError('');
		if (!form.title.trim()) { setError('Title is required.'); return; }
		if (!form.startDateTime) { setError('Start date/time is required.'); return; }
		if (form.endDateTime && new Date(form.endDateTime) <= new Date(form.startDateTime)) {
			setError('End time must be after start time.');
			return;
		}

		setSaving(true);
		try {
			const res = await studyScheduleService.update(reminder!._id, {
				title: form.title.trim(),
				description: form.description.trim(),
				startDateTime: new Date(form.startDateTime).toISOString(),
				endDateTime: form.endDateTime ? new Date(form.endDateTime).toISOString() : null,
			});
			if (res.data) onSaved(res.data);
			onClose();
		} catch {
			setError('Failed to save. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const minDt = new Date(Date.now() + 60000).toISOString().slice(0, 16);

	return (
		<AppModal
			open={Boolean(reminder)}
			title='Edit Reminder'
			onClose={onClose}
			onSave={() => void handleSave()}
			saving={saving}
			saveText='Save Changes'
			maxWidth='sm'
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<TextField label='Title' fullWidth required value={form.title} onChange={handleChange('title')} />
				<TextField
					label='Description (optional)'
					fullWidth
					multiline
					rows={2}
					value={form.description}
					onChange={handleChange('description')}
				/>
				<TextField
					label='Start Date & Time'
					type='datetime-local'
					fullWidth
					required
					value={form.startDateTime}
					onChange={handleChange('startDateTime')}
					slotProps={{ htmlInput: { min: minDt }, inputLabel: { shrink: true } }}
				/>
				<TextField
					label='End Date & Time (optional)'
					type='datetime-local'
					fullWidth
					value={form.endDateTime}
					onChange={handleChange('endDateTime')}
					slotProps={{
						htmlInput: { min: form.startDateTime || minDt },
						inputLabel: { shrink: true },
					}}
				/>
				{error && <Alert severity='error'>{error}</Alert>}
			</Box>
		</AppModal>
	);
};

/* ── StudyReminderSection ────────────────────────────────────────────────── */

const StudyReminderSection = () => {
	const [reminders, setReminders] = useState<IStudySchedule[]>([]);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState({ title: '', description: '', startDateTime: '', endDateTime: '' });
	const [error, setError] = useState('');
	const [alarmOpen, setAlarmOpen] = useState(false);
	const [alarmTitle, setAlarmTitle] = useState('');
	const [editTarget, setEditTarget] = useState<IStudySchedule | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const res = await studyScheduleService.getAll({ type: 'reminder' });
				const all = res.data ?? [];
				setReminders(all.filter((r) => r.status === 'pending' || r.status === 'active'));
			} catch {
				setError('Failed to load reminders.');
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, []);

	/* Poll every 20s to fire reminders whose startDateTime has arrived */
	useEffect(() => {
		const check = () => {
			const now = Date.now();
			setReminders((prev) => {
				let anyFired = false;
				let firedTitle = '';
				const firedAt = new Date().toISOString();
				const updated = prev.map((r) => {
					if (r.status === 'pending' && r.startDateTime && new Date(r.startDateTime).getTime() <= now) {
						anyFired = true;
						firedTitle = r.title;
						void studyScheduleService.update(r._id, { status: 'active', firedAt });
						return { ...r, status: 'active' as const, firedAt };
					}
					return r;
				});
				if (anyFired) {
					playAlarm();
					setAlarmTitle(firedTitle);
					setAlarmOpen(true);
				}
				return updated;
			});
		};
		check();
		const interval = setInterval(check, 20000);
		return () => clearInterval(interval);
	}, []);

	const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((p) => ({ ...p, [field]: e.target.value }));

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		if (!form.title.trim()) return setError('Title is required.');
		if (!form.startDateTime) return setError('Start date/time is required.');
		if (new Date(form.startDateTime) <= new Date()) return setError('Start time must be in the future.');
		if (form.endDateTime && new Date(form.endDateTime) <= new Date(form.startDateTime))
			return setError('End time must be after start time.');

		setSubmitting(true);
		try {
			const res = await studyScheduleService.createReminder({
				title: form.title.trim(),
				description: form.description.trim(),
				startDateTime: new Date(form.startDateTime).toISOString(),
				endDateTime: form.endDateTime ? new Date(form.endDateTime).toISOString() : undefined,
			});
			if (res.data) setReminders((prev) => [res.data!, ...prev]);
			setForm({ title: '', description: '', startDateTime: '', endDateTime: '' });
		} catch {
			setError('Failed to create reminder. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = (id: string) => setReminders((prev) => prev.filter((r) => r._id !== id));
	const handleComplete = (id: string) => setReminders((prev) => prev.filter((r) => r._id !== id));
	const handleSaved = (updated: IStudySchedule) =>
		setReminders((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));

	const activeReminders = reminders.filter((r) => r.status === 'active' && r.firedAt);
	const totalActiveSec = activeReminders.reduce(
		(sum, r) => sum + Math.max(0, Math.floor((Date.now() - new Date(r.firedAt!).getTime()) / 1000)),
		0,
	);

	const minDatetime = new Date(Date.now() + 60000).toISOString().slice(0, 16);

	return (
		<>
			{/* Alarm snackbar */}
			<Snackbar
				open={alarmOpen}
				onClose={() => setAlarmOpen(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				autoHideDuration={null}
			>
				<Alert
					severity='warning'
					icon={<AlarmIcon />}
					onClose={() => setAlarmOpen(false)}
					sx={{ width: '100%', fontWeight: 600 }}
				>
					⏰ Study session started: <strong>{alarmTitle}</strong>
				</Alert>
			</Snackbar>

			{/* Edit dialog */}
			<EditDialog reminder={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />

			<Grid container spacing={3}>
				{/* Create form */}
				<Grid size={{ xs: 12, md: 4 }}>
					<Card variant='outlined' sx={{ height: '100%' }}>
						<CardContent>
							<Typography
								variant='h6'
								sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
							>
								<EventNoteIcon color='primary' />
								New Reminder
							</Typography>

							<Box component='form' onSubmit={(e) => void handleSubmit(e)}>
								<TextField
									label='Title'
									fullWidth
									required
									value={form.title}
									onChange={handleChange('title')}
									sx={{ mb: 2 }}
									placeholder='e.g. Chemistry Exam Prep'
								/>
								<TextField
									label='Description (optional)'
									fullWidth
									multiline
									rows={2}
									value={form.description}
									onChange={handleChange('description')}
									sx={{ mb: 2 }}
									placeholder='Topics to cover, goals…'
								/>
								<TextField
									label='Start Date & Time'
									type='datetime-local'
									fullWidth
									required
									value={form.startDateTime}
									onChange={handleChange('startDateTime')}
									slotProps={{ htmlInput: { min: minDatetime }, inputLabel: { shrink: true } }}
									sx={{ mb: 2 }}
								/>
								<TextField
									label='End Date & Time (optional)'
									type='datetime-local'
									fullWidth
									value={form.endDateTime}
									onChange={handleChange('endDateTime')}
									slotProps={{
										htmlInput: { min: form.startDateTime || minDatetime },
										inputLabel: { shrink: true },
									}}
									sx={{ mb: 2 }}
								/>
								{error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
								<Button
									type='submit'
									variant='contained'
									fullWidth
									startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <AddIcon />}
									disabled={submitting}
								>
									{submitting ? 'Saving…' : 'Set Reminder'}
								</Button>
							</Box>
						</CardContent>
					</Card>
				</Grid>

				{/* Reminder list */}
				<Grid size={{ xs: 12, md: 8 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
						<Typography variant='h6' sx={{ fontWeight: 700 }}>
							Your Reminders
						</Typography>
						{activeReminders.length > 0 && (
							<Typography variant='body2' color='text.secondary'>
								{activeReminders.length} active ·{' '}
								<Box component='span' sx={{ fontWeight: 900, color: 'success.main', fontSize: '0.95rem' }}>
									{formatSeconds(totalActiveSec)}
								</Box>{' '}
								studied
							</Typography>
						)}
					</Box>
					<Divider sx={{ mb: 2 }} />

					{loading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
							<CircularProgress />
						</Box>
					) : reminders.length === 0 ? (
						<Box
							sx={{
								textAlign: 'center',
								py: 8,
								border: '2px dashed',
								borderColor: 'divider',
								borderRadius: 2,
							}}
						>
							<AlarmIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
							<Typography color='text.secondary'>
								No reminders yet. Set one above to schedule a study session!
							</Typography>
						</Box>
					) : (
						reminders.map((r) => (
							<ReminderCard
								key={r._id}
								reminder={r}
								onComplete={handleComplete}
								onDelete={handleDelete}
								onEdit={setEditTarget}
							/>
						))
					)}
				</Grid>
			</Grid>
		</>
	);
};

export default StudyReminderSection;
