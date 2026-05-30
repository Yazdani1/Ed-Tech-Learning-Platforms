import { useEffect, useState } from 'react';
import {
	Alert,
	Box,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Tab,
	Tabs,
	Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TimerIcon from '@mui/icons-material/Timer';
import HistoryIcon from '@mui/icons-material/History';
import DestructiveActionConfirmModal from '../../components/common/DestructiveActionConfirmModal';
import { studyScheduleService } from '../../services/studySchedule.service';
import type { IStudySchedule } from '../../types/index';
import { formatSeconds } from '../../utils/alarm';

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/* ── RowMenu with confirm ────────────────────────────────────────────────── */

interface RowMenuProps {
	label: string;
	onDelete: () => void;
}

const RowMenu = ({ label, onDelete }: RowMenuProps) => {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleDeleteConfirm = async () => {
		setDeleting(true);
		try {
			onDelete();
		} finally {
			setDeleting(false);
			setDeleteOpen(false);
		}
	};

	return (
		<>
			<IconButton size='small' onClick={(e) => setAnchor(e.currentTarget)}>
				<MoreVertIcon fontSize='small' />
			</IconButton>
			<Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
				<MenuItem
					onClick={() => { setAnchor(null); setDeleteOpen(true); }}
					sx={{ color: 'error.main' }}
				>
					<ListItemIcon>
						<DeleteIcon fontSize='small' color='error' />
					</ListItemIcon>
					<ListItemText>Delete from history</ListItemText>
				</MenuItem>
			</Menu>
			<DestructiveActionConfirmModal
				open={deleteOpen}
				onClose={() => setDeleteOpen(false)}
				onConfirm={() => void handleDeleteConfirm()}
				title='Delete from History'
				confirmText='Delete'
				confirming={deleting}
				maxWidth='xs'
			>
				{`Remove "${label}" from your history? This cannot be undone.`}
			</DestructiveActionConfirmModal>
		</>
	);
};

/* ── TotalBadge ──────────────────────────────────────────────────────────── */

interface TotalBadgeProps {
	label: string;
	seconds: number;
	color?: string;
}

const TotalBadge = ({ label, seconds, color = '#2196f3' }: TotalBadgeProps) => {
	if (seconds <= 0) return null;
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	const display = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

	return (
		<Box
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 1,
				px: 2,
				py: 0.75,
				mb: 2,
				borderRadius: 2,
				bgcolor: `${color}14`,
				border: `1px solid ${color}44`,
			}}
		>
			<Typography variant='body2' color='text.secondary'>
				{label}
			</Typography>
			<Typography sx={{ fontWeight: 900, color, fontSize: '1rem', fontFamily: 'monospace' }}>
				{display}
			</Typography>
		</Box>
	);
};

/* ── StudyHistorySection ─────────────────────────────────────────────────── */

const StudyHistorySection = () => {
	const [timerHistory, setTimerHistory] = useState<IStudySchedule[]>([]);
	const [reminderHistory, setReminderHistory] = useState<IStudySchedule[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [tab, setTab] = useState(0);

	useEffect(() => {
		const load = async () => {
			try {
				const [timersRes, remindersRes] = await Promise.all([
					studyScheduleService.getAll({ type: 'timer', status: 'completed' }),
					studyScheduleService.getAll({ type: 'reminder', status: 'completed' }),
				]);
				setTimerHistory(timersRes.data ?? []);
				setReminderHistory(remindersRes.data ?? []);
			} catch {
				setError('Failed to load history.');
			} finally {
				setLoading(false);
			}
		};
		void load();
	}, []);

	const handleDelete = async (id: string, type: 'timer' | 'reminder') => {
		await studyScheduleService.delete(id);
		if (type === 'timer') setTimerHistory((p) => p.filter((t) => t._id !== id));
		else setReminderHistory((p) => p.filter((r) => r._id !== id));
	};

	if (loading)
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);

	if (error) return <Alert severity='error'>{error}</Alert>;

	const isEmpty = timerHistory.length === 0 && reminderHistory.length === 0;

	if (isEmpty)
		return (
			<Box sx={{ textAlign: 'center', py: 10, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
				<HistoryIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
				<Typography color='text.secondary'>
					No completed sessions yet. Your history will appear here.
				</Typography>
			</Box>
		);

	/* totals */
	const totalTimerSec = timerHistory.reduce((s, t) => s + (t.duration ?? 0), 0);
	const totalReminderSec = reminderHistory.reduce((s, r) => {
		if (!r.firedAt) return s;
		const end = r.endDateTime
			? new Date(r.endDateTime).getTime()
			: new Date(r.updatedAt).getTime();
		return s + Math.max(0, Math.floor((end - new Date(r.firedAt).getTime()) / 1000));
	}, 0);

	return (
		<Box>
			<Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ mb: 3 }}>
				<Tab icon={<TimerIcon />} iconPosition='start' label={`Timers (${timerHistory.length})`} />
				<Tab icon={<EventNoteIcon />} iconPosition='start' label={`Reminders (${reminderHistory.length})`} />
			</Tabs>

			{/* Timer history */}
			{tab === 0 && (
				<>
					<TotalBadge label='Total study time:' seconds={totalTimerSec} color='#2196f3' />
					<Card variant='outlined'>
						{timerHistory.length === 0 ? (
							<CardContent>
								<Typography color='text.secondary' align='center' sx={{ py: 4 }}>
									No completed timers yet.
								</Typography>
							</CardContent>
						) : (
							<List disablePadding>
								{timerHistory.map((item, idx) => (
									<Box key={item._id}>
										{idx > 0 && <Divider />}
										<ListItem
											secondaryAction={
												<RowMenu
													label={item.title}
													onDelete={() => void handleDelete(item._id, 'timer')}
												/>
											}
										>
											<CheckCircleIcon color='success' sx={{ mr: 2, flexShrink: 0 }} />
											<ListItemText
												primary={
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
														<Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>
														<Chip
															label={formatSeconds(item.duration ?? 0)}
															size='small'
															variant='outlined'
															sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', borderColor: 'primary.main' }}
														/>
													</Box>
												}
												secondary={
													<Box component='span'>
														{item.description && (
															<Typography
																variant='caption'
																component='span'
																sx={{ display: 'block' }}
																color='text.secondary'
															>
																{item.description}
															</Typography>
														)}
														<Typography variant='caption' component='span' color='text.disabled'>
															Completed:{' '}
															{item.completedAt ? fmtDate(item.completedAt) : fmtDate(item.updatedAt)}
														</Typography>
													</Box>
												}
											/>
										</ListItem>
									</Box>
								))}
							</List>
						)}
					</Card>
				</>
			)}

			{/* Reminder history */}
			{tab === 1 && (
				<>
					<TotalBadge label='Total studied:' seconds={totalReminderSec} color='#ff9800' />
					<Card variant='outlined'>
						{reminderHistory.length === 0 ? (
							<CardContent>
								<Typography color='text.secondary' align='center' sx={{ py: 4 }}>
									No completed reminders yet.
								</Typography>
							</CardContent>
						) : (
							<List disablePadding>
								{reminderHistory.map((item, idx) => (
									<Box key={item._id}>
										{idx > 0 && <Divider />}
										<ListItem
											secondaryAction={
												<RowMenu
													label={item.title}
													onDelete={() => void handleDelete(item._id, 'reminder')}
												/>
											}
										>
											<EventNoteIcon color='primary' sx={{ mr: 2, flexShrink: 0 }} />
											<ListItemText
												primary={
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
														<Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>
														{item.firedAt && (() => {
															const end = item.endDateTime
																? new Date(item.endDateTime).getTime()
																: new Date(item.updatedAt).getTime();
															const sec = Math.max(0, Math.floor((end - new Date(item.firedAt!).getTime()) / 1000));
															return sec > 0 ? (
																<Chip
																	label={formatSeconds(sec)}
																	size='small'
																	variant='outlined'
																	sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'warning.main', borderColor: 'warning.main' }}
																/>
															) : null;
														})()}
													</Box>
												}
												secondary={
													<Box component='span'>
														{item.description && (
															<Typography
																variant='caption'
																component='span'
																sx={{ display: 'block' }}
																color='text.secondary'
															>
																{item.description}
															</Typography>
														)}
														<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
															<Typography variant='caption' component='span' color='text.disabled'>
																Started: {item.startDateTime ? fmtDate(item.startDateTime) : '—'}
															</Typography>
															{item.endDateTime && (
																<Typography variant='caption' component='span' color='text.disabled'>
																	Ended: {fmtDate(item.endDateTime)}
																</Typography>
															)}
														</Box>
													</Box>
												}
											/>
										</ListItem>
									</Box>
								))}
							</List>
						)}
					</Card>
				</>
			)}
		</Box>
	);
};

export default StudyHistorySection;
