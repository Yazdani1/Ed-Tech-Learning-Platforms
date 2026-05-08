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
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import AppPagination from '../../components/common/AppPagination';
import ItemActionMenu from '../../components/common/ItemActionMenu';
import { useAuth } from '../../context/useAuth';
import { useChat } from '../../context/ChatContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import { useNotifications } from '../../context/NotificationContext';
import { notificationService } from '../../services/notification.service';
import { formatDateTime } from '../../utils/dateTime';
import type { INotification, NotificationPriority, UserRole } from '../../types';

const ROLE_OPTIONS: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'];
const PRIORITY_OPTIONS: NotificationPriority[] = ['Low', 'Normal', 'High', 'Urgent'];
const PAGE_SIZE = 10;

const PRIORITY_STYLES: Record<
	NotificationPriority,
	{ color: 'default' | 'info' | 'warning' | 'error' | 'success'; border: string }
> = {
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

interface PaginationState {
	page: number;
	limit: number;
	total: number;
}

export default function NotificationsPage() {
	const { user } = useAuth();
	const { socket } = useChat();
	const { confirm } = useConfirmModal();
	const { refreshUnreadCount, clearUnreadCount } = useNotifications();
	const [tab, setTab] = useState<'send' | 'all' | 'sent'>('all');
	const [notifications, setNotifications] = useState<INotification[]>([]);
	const [sentNotifications, setSentNotifications] = useState<INotification[]>([]);
	const [inboxPagination, setInboxPagination] = useState<PaginationState>({
		page: 1,
		limit: PAGE_SIZE,
		total: 0,
	});
	const [sentPagination, setSentPagination] = useState<PaginationState>({
		page: 1,
		limit: PAGE_SIZE,
		total: 0,
	});
	const [loadingInbox, setLoadingInbox] = useState(true);
	const [loadingSent, setLoadingSent] = useState(false);
	const [sending, setSending] = useState(false);
	const [savingEdit, setSavingEdit] = useState(false);
	const [form, setForm] = useState(blankForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState(blankForm);
	const [editModalOpen, setEditModalOpen] = useState(false);

	const canSend = user?.role === 'Super Admin' || user?.role === 'Admin';
	const unreadCount = useMemo(
		() => notifications.filter((notification) => !notification.isRead).length,
		[notifications],
	);
	const inboxTotalPages = Math.ceil(inboxPagination.total / inboxPagination.limit);
	const sentTotalPages = Math.ceil(sentPagination.total / sentPagination.limit);

	const loadInbox = (page = inboxPagination.page) => {
		setLoadingInbox(true);
		notificationService
			.getMine({ page, limit: PAGE_SIZE })
			.then((res) => {
				setNotifications(res.data ?? []);
				setInboxPagination({
					page: res.page ?? page,
					limit: res.limit ?? PAGE_SIZE,
					total: res.total ?? 0,
				});
				refreshUnreadCount();
			})
			.catch(() => {})
			.finally(() => setLoadingInbox(false));
	};

	const loadSent = (page = sentPagination.page) => {
		if (!canSend) return;
		setLoadingSent(true);
		notificationService
			.getSent({ page, limit: PAGE_SIZE })
			.then((res) => {
				setSentNotifications(res.data ?? []);
				setSentPagination({
					page: res.page ?? page,
					limit: res.limit ?? PAGE_SIZE,
					total: res.total ?? 0,
				});
			})
			.catch(() => {})
			.finally(() => setLoadingSent(false));
	};

	useEffect(() => {
		loadInbox(1);
		if (canSend) {
			setTab('send');
			loadSent(1);
		}
	}, [canSend]);

	useEffect(() => {
		if (!socket) return;

		const onNewNotification = ({ notification }: { notification: INotification }) => {
			setInboxPagination((prev) => ({ ...prev, total: prev.total + 1 }));
			setNotifications((prev) =>
				inboxPagination.page === 1 ? [notification, ...prev].slice(0, PAGE_SIZE) : prev,
			);
		};

		const onUpdatedNotification = ({ notification }: { notification: INotification }) => {
			setNotifications((prev) =>
				prev.map((item) => (item._id === notification._id ? notification : item)),
			);
		};

		const onDeletedNotification = ({ notificationId }: { notificationId: string }) => {
			setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
			setInboxPagination((prev) => ({ ...prev, total: Math.max(prev.total - 1, 0) }));
			refreshUnreadCount();
		};

		socket.on('notification:new', onNewNotification);
		socket.on('notification:updated', onUpdatedNotification);
		socket.on('notification:deleted', onDeletedNotification);
		return () => {
			socket.off('notification:new', onNewNotification);
			socket.off('notification:updated', onUpdatedNotification);
			socket.off('notification:deleted', onDeletedNotification);
		};
	}, [socket, inboxPagination.page]);

	const toggleRole = (role: UserRole, mode: 'create' | 'edit') => {
		const setter = mode === 'create' ? setForm : setEditForm;
		setter((prev) => {
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
			loadSent(1);
			setSentPagination((prev) => ({ ...prev, page: 1 }));
		} finally {
			setSending(false);
		}
	};

	const startEdit = (notification: INotification) => {
		setEditingId(notification._id);
		setEditForm({
			title: notification.title,
			message: notification.message,
			priority: notification.priority,
			targetRoles: notification.targetRoles,
		});
		setEditModalOpen(true);
	};

	const closeEditModal = () => {
		setEditModalOpen(false);
		setEditingId(null);
	};

	const handleUpdate = async () => {
		if (!editingId) return;
		if (!editForm.title.trim() || !editForm.message.trim()) {
			toast.error('Title and message are required');
			return;
		}
		if (editForm.targetRoles.length === 0) {
			toast.error('Select at least one recipient role');
			return;
		}

		setSavingEdit(true);
		try {
			const res = await notificationService.update(editingId, editForm);
			if (res.data) {
				setSentNotifications((prev) =>
					prev.map((item) => (item._id === editingId ? res.data! : item)),
				);
			}
			closeEditModal();
			toast.success('Notification updated');
		} finally {
			setSavingEdit(false);
		}
	};

	const handleDelete = async (notification: INotification) => {
		const confirmed = await confirm({
			title: 'Delete Notification',
			message: `Delete "${notification.title}"? Recipients will no longer see it.`,
			confirmText: 'Delete',
			cancelText: 'Keep',
		});
		if (!confirmed) return;

		await notificationService.delete(notification._id);
		toast.success('Notification deleted');
		loadSent(sentPagination.page);
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

	const renderRoleSelectors = (mode: 'create' | 'edit') => {
		const state = mode === 'create' ? form : editForm;
		return (
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
				{ROLE_OPTIONS.map((role) => (
					<FormControlLabel
						key={role}
						control={
							<Checkbox
								checked={state.targetRoles.includes(role)}
								onChange={() => toggleRole(role, mode)}
							/>
						}
						label={role}
					/>
				))}
			</Box>
		);
	};

	const renderInbox = () => (
		<Paper elevation={0} sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
			<Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<NotificationsActiveOutlinedIcon color='primary' />
					<Typography variant='h6' sx={{ fontWeight: 800 }}>
						All Notifications
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
			<Divider />
			{loadingInbox ? (
				<Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
					<CircularProgress />
				</Box>
			) : notifications.length === 0 ? (
				<Box sx={{ p: 4 }}>
					<Alert severity='info'>No notifications yet.</Alert>
				</Box>
			) : (
				<>
					<Stack divider={<Divider flexItem />}>
						{notifications.map((notification) => (
							<NotificationItem
								key={notification._id}
								notification={notification}
								onClick={() => void markRead(notification)}
							/>
						))}
					</Stack>
					<Box sx={{ px: 2.5, pb: 2.5 }}>
						<AppPagination
							page={inboxPagination.page}
							totalPages={inboxTotalPages}
							totalItems={inboxPagination.total}
							pageSize={inboxPagination.limit}
							onChange={(page) => {
								setInboxPagination((prev) => ({ ...prev, page }));
								loadInbox(page);
							}}
						/>
					</Box>
				</>
			)}
		</Paper>
	);

	const renderSent = () => (
		<Paper elevation={0} sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
			<Box sx={{ p: 2.5 }}>
				<Typography variant='h6' sx={{ fontWeight: 800 }}>
					Sent Notifications
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					Edit, reprioritize, or remove notifications sent by the admin team.
				</Typography>
			</Box>
			<Divider />
			{loadingSent ? (
				<Box sx={{ py: 7, display: 'flex', justifyContent: 'center' }}>
					<CircularProgress />
				</Box>
			) : sentNotifications.length === 0 ? (
				<Box sx={{ p: 4 }}>
					<Alert severity='info'>No notifications sent yet.</Alert>
				</Box>
			) : (
				<>
					<Stack divider={<Divider flexItem />}>
						{sentNotifications.map((notification) => {
							const priorityStyle = PRIORITY_STYLES[notification.priority];
							return (
								<Box
									key={notification._id}
									sx={{ p: 2.25, borderLeft: '4px solid', borderLeftColor: priorityStyle.border }}
								>
									<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Box
												sx={{
													display: 'flex',
													gap: 1,
													alignItems: 'center',
													flexWrap: 'wrap',
													mb: 0.75,
												}}
											>
												<Typography sx={{ fontWeight: 900 }}>{notification.title}</Typography>
												<Chip size='small' label={notification.priority} color={priorityStyle.color} />
												<Chip
													size='small'
													label={notification.targetRoles.join(', ')}
													variant='outlined'
												/>
											</Box>
											<Typography variant='body2' sx={{ lineHeight: 1.65, mb: 1 }}>
												{notification.message}
											</Typography>
											<Typography variant='caption' color='text.secondary'>
												Sent by {notification.sentBy?.name ?? 'Admin'} •{' '}
												{formatDateTime(notification.createdAt)}
											</Typography>
										</Box>
										<ItemActionMenu
											actions={[
												{
													label: 'Edit',
													icon: <EditOutlinedIcon fontSize='small' sx={{ mr: 1 }} />,
													onClick: () => startEdit(notification),
												},
												{
													label: 'Delete',
													icon: <DeleteOutlineIcon fontSize='small' sx={{ mr: 1 }} />,
													color: 'error',
													onClick: () => void handleDelete(notification),
												},
											]}
										/>
									</Box>
								</Box>
							);
						})}
					</Stack>
					<Box sx={{ px: 2.5, pb: 2.5 }}>
						<AppPagination
							page={sentPagination.page}
							totalPages={sentTotalPages}
							totalItems={sentPagination.total}
							pageSize={sentPagination.limit}
							onChange={(page) => {
								setSentPagination((prev) => ({ ...prev, page }));
								loadSent(page);
							}}
						/>
					</Box>
				</>
			)}
		</Paper>
	);

	return (
		<Box>
			<Box sx={{ mb: 3 }}>
				<Typography variant='h4' sx={{ fontWeight: 800 }}>
					Notifications
				</Typography>
				<Typography variant='body2' color='text.secondary'>
					{canSend
						? 'Send targeted announcements and manage notification history.'
						: 'Review updates sent by your learning platform team.'}
				</Typography>
			</Box>

			{canSend ? (
				<>
					<Paper
						elevation={0}
						sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
					>
						<Tabs value={tab} onChange={(_event, value) => setTab(value)} sx={{ px: 1.5 }}>
							<Tab value='send' label='Send Notification' />
							<Tab value='all' label='All Notifications' />
							<Tab value='sent' label='Sent Notifications' />
						</Tabs>
					</Paper>

					{tab === 'send' && (
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
							<Stack spacing={2} sx={{ maxWidth: 760 }}>
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
									{renderRoleSelectors('create')}
								</Box>
								<Button
									variant='contained'
									startIcon={
										sending ? (
											<CircularProgress size={16} color='inherit' />
										) : (
											<SendOutlinedIcon />
										)
									}
									onClick={() => void handleSend()}
									disabled={sending}
									sx={{ textTransform: 'none', fontWeight: 800, py: 1.1, alignSelf: 'flex-start' }}
								>
									Send Notification
								</Button>
							</Stack>
						</Paper>
					)}

					{tab === 'all' && renderInbox()}
					{tab === 'sent' && renderSent()}
				</>
			) : (
				renderInbox()
			)}

			<AppModal
				open={editModalOpen}
				title='Edit Notification'
				onClose={closeEditModal}
				onSave={() => void handleUpdate()}
				saving={savingEdit}
				saveText='Save Changes'
				maxWidth='sm'
			>
				<Stack spacing={2} sx={{ pt: 0.5 }}>
					<TextField
						label='Title'
						value={editForm.title}
						onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
						fullWidth
						slotProps={{ htmlInput: { maxLength: 140 } }}
					/>
					<TextField
						label='Message'
						value={editForm.message}
						onChange={(e) => setEditForm((prev) => ({ ...prev, message: e.target.value }))}
						fullWidth
						multiline
						minRows={4}
						slotProps={{ htmlInput: { maxLength: 2000 } }}
					/>
					<FormControl fullWidth>
						<InputLabel>Priority</InputLabel>
						<Select
							label='Priority'
							value={editForm.priority}
							onChange={(e) =>
								setEditForm((prev) => ({
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
						{renderRoleSelectors('edit')}
					</Box>
				</Stack>
			</AppModal>
		</Box>
	);
}

function NotificationItem({
	notification,
	onClick,
}: {
	notification: INotification;
	onClick: () => void;
}) {
	const priorityStyle = PRIORITY_STYLES[notification.priority];

	return (
		<Box
			onClick={onClick}
			sx={{
				p: 2.25,
				cursor: notification.isRead ? 'default' : 'pointer',
				bgcolor: notification.isRead ? 'background.paper' : 'rgba(99,102,241,0.1)',
				borderLeft: '4px solid',
				borderLeftColor: priorityStyle.border,
				transition: 'background 0.15s ease',
				'&:hover': { bgcolor: notification.isRead ? 'grey.50' : 'rgba(99,102,241,0.15)' },
			}}
		>
			<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
				<Box sx={{ position: 'relative' }}>
					<Avatar
						src={notification.sentBy?.avatar}
						sx={{ bgcolor: priorityStyle.border, width: 38, height: 38, fontSize: 14 }}
					>
						{notification.sentBy?.name?.[0]?.toUpperCase() ?? 'N'}
					</Avatar>
					{!notification.isRead && (
						<Box
							sx={{
								position: 'absolute',
								top: -2,
								right: -2,
								width: 11,
								height: 11,
								borderRadius: '50%',
								bgcolor: 'primary.main',
								border: '2px solid',
								borderColor: 'background.paper',
							}}
						/>
					)}
				</Box>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
						<Typography sx={{ fontWeight: notification.isRead ? 700 : 900, color: notification.isRead ? 'text.primary' : 'primary.main' }}>
							{notification.title}
						</Typography>
						<Chip size='small' label={notification.priority} color={priorityStyle.color} />
						{!notification.isRead && (
							<Chip size='small' label='Unread' color='primary' variant='outlined' />
						)}
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
}
