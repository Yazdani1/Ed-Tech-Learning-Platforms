import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	Divider,
	FormControl,
	FormControlLabel,
	Grid,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import toast from 'react-hot-toast';
import { notificationService } from '../../services/notification.service';
import { useAuth } from '../../context/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { formatDateTime } from '../../utils/dateTime';
import type { INotification, NotificationPriority, UserRole } from '../../types';

const ROLE_OPTIONS: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
const PRIORITY_OPTIONS: NotificationPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

const PRIORITY_STYLES: Record<NotificationPriority, { color: 'default' | 'info' | 'warning' | 'error' | 'success'; border: string }> = {
	Low: { color: 'success', border: '#22c55e' },
	Normal: { color: 'info', border: '#3b82f6' },
	High: { color: 'warning', border: '#f59e0b' },
	Urgent: { color: 'error', border: '#ef4444' },
};

const blankForm = {
	title: '',
	message: '',
	priority: 'Normal' as NotificationPriority,
	targetRoles: ['Student'] as UserRole[],
};

export default function NotificationsPage() {
	const { user } = useAuth();
	const { refreshUnreadCount, clearUnreadCount } = useNotifications();
	const [notifications, setNotifications] = useState<INotification[]>([]);
	const [sentNotifications, setSentNotifications] = useState<INotification[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [form, setForm] = useState(blankForm);

	const canSend = user?.role === 'Super Admin' || user?.role === 'Admin';
	const unreadCount = useMemo(
		() => notifications.filter((notification) => !notification.isRead).length,
		[notifications],
	);

	const loadNotifications = () => {
		setLoading(true);
		Promise.all([
			notificationService.getMine(),
			canSend ? notificationService.getSent() : Promise.resolve({ data: [] as INotification[] }),
		])
			.then(([mineRes, sentRes]) => {
				setNotifications(mineRes.data ?? []);
				setSentNotifications(sentRes.data ?? []);
				refreshUnreadCount();
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		loadNotifications();
	}, [canSend]);

	const toggleRole = (role: UserRole) => {
		setForm((prev) => {
			const exists = prev.targetRoles.includes(role);
			const nextRoles = exists
				? prev.targetRoles.filter((item) => item !== role)
				: [...prev.targetRoles, role];
			return { ...prev, targetRoles: nextRoles };
		});
	};

	const handleSend = async () => {
		if (!form.title.trim() || !form.message.trim()) {
			toast.error('Title and message are required');
			return;
		}
		if (form.targetRoles.length === 0) {
			toast.error('Select at least one recipient role');
			return;
		}

		setSending(true);
		try {
			const res = await notificationService.create(form);
			toast.success(res.message ?? 'Notification sent');
			setForm(blankForm);
			loadNotifications();
		} finally {
			setSending(false);
		}
	};

	const markRead = async (notification: INotification) => {
		if (notification.isRead) return;
		try {
			const res = await notificationService.markRead(notification._id);
			if (res.data) {
				setNotifications((prev) =>
					prev.map((item) => (item._id === notification._id ? res.data! : item)),
				);
			}
			refreshUnreadCount();
		} catch {
			// handled by interceptor
		}
	};

	const markAllRead = async () => {
		await notificationService.markAllRead();
		setNotifications((prev) =>
			prev.map((notification) => ({
				...notification,
				isRead: true,
				readAt: notification.readAt ?? new Date().toISOString(),
			})),
		);
		clearUnreadCount();
		toast.success('All notifications marked as read');
	};

	return (
		<Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center', mb: 3 }}>
				<Box>
					<Typography variant='h4' sx={{ fontWeight: 800 }}>
						Notifications
					</Typography>
					<Typography variant='body2' color='text.secondary'>
						{canSend
							? 'Send targeted announcements and review received updates.'
							: 'Review updates sent by your learning platform team.'}
					</Typography>
				</Box>
				<Button
					variant='outlined'
					startIcon={<MarkEmailReadOutlinedIcon />}
					onClick={() => void markAllRead()}
					disabled={unreadCount === 0}
					sx={{ textTransform: 'none', fontWeight: 700 }}
				>
					Mark all read
				</Button>
			</Box>

			<Grid container spacing={3}>
				{canSend && (
					<Grid size={{ xs: 12, lg: 5 }}>
						<Paper
							elevation={0}
							sx={{ p: 2.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
								<SendOutlinedIcon color='primary' />
								<Typography variant='h6' sx={{ fontWeight: 800 }}>
									Send Push Notification
								</Typography>
							</Box>
							<Stack spacing={2}>
								<TextField
									label='Title'
									value={form.title}
									onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
									fullWidth
									slotProps={{ htmlInput: { maxLength: 140 } }}
								/>
								<TextField
									label='Message'
									value={form.message}
									onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
									fullWidth
									multiline
									minRows={4}
									slotProps={{ htmlInput: { maxLength: 2000 } }}
								/>
								<FormControl fullWidth>
									<InputLabel>Priority</InputLabel>
									<Select
										label='Priority'
										value={form.priority}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												priority: e.target.value as NotificationPriority,
											}))
										}
									>
										{PRIORITY_OPTIONS.map((priority) => (
											<MenuItem key={priority} value={priority}>
												{priority}
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<Box>
									<Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
										Send to roles
									</Typography>
									<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
										{ROLE_OPTIONS.map((role) => (
											<FormControlLabel
												key={role}
												control={
													<Checkbox
														checked={form.targetRoles.includes(role)}
														onChange={() => toggleRole(role)}
													/>
												}
												label={role}
											/>
										))}
									</Box>
								</Box>
								<Button
									variant='contained'
									startIcon={sending ? <CircularProgress size={16} color='inherit' /> : <SendOutlinedIcon />}
									onClick={() => void handleSend()}
									disabled={sending}
									sx={{ textTransform: 'none', fontWeight: 800, py: 1.1 }}
								>
									Send Notification
								</Button>
							</Stack>
						</Paper>

						<Paper
							elevation={0}
							sx={{ mt: 3, p: 2.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
						>
							<Typography variant='h6' sx={{ fontWeight: 800, mb: 2 }}>
								Recently Sent
							</Typography>
							{sentNotifications.length === 0 ? (
								<Typography variant='body2' color='text.secondary'>
									No notifications sent yet.
								</Typography>
							) : (
								<Stack divider={<Divider flexItem />} spacing={1.5}>
									{sentNotifications.slice(0, 6).map((notification) => (
										<Box key={notification._id}>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
												<Typography variant='body2' sx={{ fontWeight: 800 }} noWrap>
													{notification.title}
												</Typography>
												<Chip
													size='small'
													label={notification.priority}
													color={PRIORITY_STYLES[notification.priority].color}
												/>
											</Box>
											<Typography variant='caption' color='text.secondary'>
												{notification.targetRoles.join(', ')} • {formatDateTime(notification.createdAt)}
											</Typography>
										</Box>
									))}
								</Stack>
							)}
						</Paper>
					</Grid>
				)}

				<Grid size={{ xs: 12, lg: canSend ? 7 : 12 }}>
					<Paper
						elevation={0}
						sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
					>
						<Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<NotificationsActiveOutlinedIcon color='primary' />
								<Typography variant='h6' sx={{ fontWeight: 800 }}>
									All Notifications
								</Typography>
							</Box>
							<Chip label={`${unreadCount} unread`} color={unreadCount > 0 ? 'error' : 'default'} />
						</Box>
						<Divider />

						{loading ? (
							<Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
								<CircularProgress />
							</Box>
						) : notifications.length === 0 ? (
							<Box sx={{ p: 4 }}>
								<Alert severity='info'>No notifications yet.</Alert>
							</Box>
						) : (
							<Stack divider={<Divider flexItem />}>
								{notifications.map((notification) => {
									const priorityStyle = PRIORITY_STYLES[notification.priority];
									return (
										<Box
											key={notification._id}
											onClick={() => void markRead(notification)}
											sx={{
												p: 2.25,
												cursor: notification.isRead ? 'default' : 'pointer',
												bgcolor: notification.isRead ? 'background.paper' : 'rgba(99,102,241,0.06)',
												borderLeft: '4px solid',
												borderLeftColor: priorityStyle.border,
												transition: 'background 0.15s ease',
												'&:hover': { bgcolor: notification.isRead ? 'grey.50' : 'rgba(99,102,241,0.1)' },
											}}
										>
											<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
												<Avatar
													src={notification.sentBy?.avatar}
													sx={{ bgcolor: priorityStyle.border, width: 38, height: 38, fontSize: 14 }}
												>
													{notification.sentBy?.name?.[0]?.toUpperCase() ?? 'N'}
												</Avatar>
												<Box sx={{ flex: 1, minWidth: 0 }}>
													<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
														<Typography sx={{ fontWeight: notification.isRead ? 700 : 900 }}>
															{notification.title}
														</Typography>
														<Chip size='small' label={notification.priority} color={priorityStyle.color} />
														{!notification.isRead && <Chip size='small' label='Unread' color='primary' variant='outlined' />}
													</Box>
													<Typography variant='body2' sx={{ lineHeight: 1.65, mb: 1 }}>
														{notification.message}
													</Typography>
													<Typography variant='caption' color='text.secondary'>
														Sent by {notification.sentBy?.name ?? 'Admin'} • {formatDateTime(notification.createdAt)}
													</Typography>
												</Box>
											</Box>
										</Box>
									);
								})}
							</Stack>
						)}
					</Paper>
				</Grid>
			</Grid>
		</Box>
	);
}
