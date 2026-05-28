import { Fragment, useEffect, useMemo, useRef, useState, type FC } from 'react';
import {
	Avatar,
	Badge,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	FormControl,
	IconButton,
	InputAdornment,
	InputLabel,
	List,
	ListItemAvatar,
	ListItemButton,
	ListItemText,
	MenuItem,
	Paper,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import AppModal from '../../components/common/AppModal';
import DestructiveActionConfirmModal from '../../components/common/DestructiveActionConfirmModal';
import toast from 'react-hot-toast';
import ItemActionMenu, { type ItemAction } from '../../components/common/ItemActionMenu';
import SelectedChatFilePreview from '../../components/chat/SelectedChatFilePreview';
import TypingIndicator from '../../components/chat/TypingIndicator';
import { useAuth } from '../../context/useAuth';
import { useChat } from '../../context/ChatContext';
import { groupChatService } from '../../services/groupChat.service';
import type { IGroupChatChannel, IGroupChatMessage, IGroupChatTypingEvent, IUser } from '../../types/index';

const HEADER_GRADIENT = 'linear-gradient(135deg, #0f766e 0%, #2563eb 52%, #7c3aed 100%)';
const SENT_GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';
const adminRoles = ['Super Admin', 'Admin', 'Moderator'];
const roleColors: Record<string, string> = {
	'Super Admin': '#f59e0b',
	Admin: '#ef4444',
	Moderator: '#10b981',
	Teacher: '#3b82f6',
	Student: '#8b5cf6',
};

interface ChannelModalProps {
	open: boolean;
	channel?: IGroupChatChannel | null;
	onClose: () => void;
	onSaved: (channel: IGroupChatChannel) => void;
}

interface AddMembersModalProps {
	open: boolean;
	channel: IGroupChatChannel | null;
	onClose: () => void;
	onSaved: (channel: IGroupChatChannel) => void;
}

interface MembersModalProps {
	open: boolean;
	channel: IGroupChatChannel | null;
	currentUserId?: string;
	canManage: boolean;
	onClose: () => void;
	onApprove: (userId: string) => Promise<void>;
	onRemove: (userId: string, userName: string) => void;
}

type GroupChatConfirmAction =
	| { type: 'archiveChannel'; channelName: string }
	| { type: 'leaveChannel'; channelName: string }
	| { type: 'removeMember'; userId: string; userName: string };

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const isAdminRole = (role?: string) => Boolean(role && adminRoles.includes(role));
const avatarColor = (role: string) => roleColors[role] ?? '#2563eb';
const isImage = (mimeType: string) => mimeType.startsWith('image/');
const isPdf = (mimeType: string) => mimeType === 'application/pdf';

const getMemberUnread = (channel: IGroupChatChannel, userId?: string) =>
	channel.members.find((member) => member.user._id === userId)?.unreadCount ?? 0;

const getMemberCountLabel = (channel: IGroupChatChannel) =>
	`${channel.members.length} ${channel.members.length === 1 ? 'member' : 'members'}`;

const ChannelModal: FC<ChannelModalProps> = ({ open, channel, onClose, onSaved }) => {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [type, setType] = useState<'Public' | 'Private'>('Public');
	const [saving, setSaving] = useState(false);
	const editing = Boolean(channel);

	useEffect(() => {
		if (!open) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setName(channel?.name ?? '');
		setDescription(channel?.description ?? '');
		setType(channel?.type ?? 'Public');
	}, [open, channel]);

	const submit = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			const payload = { name: name.trim(), description: description.trim(), type };
			const res = channel
				? await groupChatService.updateChannel(channel._id, payload)
				: await groupChatService.createChannel(payload);
			if (res.data) onSaved(res.data);
			setName('');
			setDescription('');
			setType('Public');
			onClose();
			toast.success(editing ? 'Channel updated' : 'Channel created');
		} finally {
			setSaving(false);
		}
	};

	return (
		<AppModal
			open={open}
			title={editing ? 'Edit Channel' : 'Create Channel'}
			onClose={onClose}
			onSave={() => void submit()}
			saveText={editing ? 'Update' : 'Create'}
			saving={saving}
			saveDisabled={!name.trim()}
			maxWidth="sm"
		>
			<Stack spacing={2} sx={{ pt: 1 }}>
				<TextField label="Channel name" value={name} onChange={(event) => setName(event.target.value)} fullWidth />
				<TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} fullWidth multiline minRows={3} />
				<FormControl fullWidth>
					<InputLabel>Channel type</InputLabel>
					<Select label="Channel type" value={type} onChange={(event) => setType(event.target.value as 'Public' | 'Private')}>
						<MenuItem value="Public">Public Channel</MenuItem>
						<MenuItem value="Private">Private Channel</MenuItem>
					</Select>
				</FormControl>
			</Stack>
		</AppModal>
	);
};

const AddMembersModal: FC<AddMembersModalProps> = ({ open, channel, onClose, onSaved }) => {
	const [search, setSearch] = useState('');
	const [users, setUsers] = useState<Array<Pick<IUser, '_id' | 'name' | 'avatar' | 'role' | 'email'>>>([]);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const memberIds = new Set(channel?.members.map((member) => member.user._id) ?? []);

	useEffect(() => {
		if (!open || search.trim().length < 2) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setUsers([]);
			return;
		}
		const timeout = setTimeout(() => {
			groupChatService.searchUsers(search).then((res) => setUsers(res.data ?? []));
		}, 250);
		return () => clearTimeout(timeout);
	}, [open, search]);

	const toggleUser = (userId: string) => {
		setSelectedIds((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
	};

	const save = async () => {
		if (!channel || selectedIds.length === 0) return;
		setSaving(true);
		try {
			const res = await groupChatService.addMembers(channel._id, selectedIds);
			if (res.data) onSaved(res.data);
			setSelectedIds([]);
			setSearch('');
			onClose();
			toast.success('Members added');
		} finally {
			setSaving(false);
		}
	};

	const selectedCount = selectedIds.length;

	return (
		<AppModal
			open={open}
			title="Add Members"
			onClose={onClose}
			onSave={() => void save()}
			saveText={selectedCount > 0 ? `Add Selected (${selectedCount})` : 'Add Selected'}
			saving={saving}
			saveDisabled={selectedCount === 0}
			maxWidth="sm"
		>
			<Stack spacing={2} sx={{ pt: 1 }}>
				<TextField
					fullWidth
					label="Search users"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }}
				/>
				<List sx={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
					{users.map((item) => {
						const disabled = memberIds.has(item._id);
						const selected = selectedIds.includes(item._id);
						return (
							<ListItemButton key={item._id} disabled={disabled} selected={selected} onClick={() => toggleUser(item._id)}>
								<ListItemAvatar>
									<Avatar src={item.avatar}>{item.name[0]}</Avatar>
								</ListItemAvatar>
								<ListItemText primary={item.name} secondary={disabled ? 'Already a member' : `${item.role} - ${item.email ?? ''}`} />
							</ListItemButton>
						);
					})}
					{search.trim().length >= 2 && users.length === 0 && (
						<Typography sx={{ p: 2 }} color="text.secondary">No users found.</Typography>
					)}
				</List>
			</Stack>
		</AppModal>
	);
};

const MembersModal: FC<MembersModalProps> = ({ open, channel, currentUserId, canManage, onClose, onApprove, onRemove }) => {
	const [activeTab, setActiveTab] = useState(0);
	const pendingRequests = channel?.joinRequests.filter((request) => request.status === 'Pending') ?? [];

	useEffect(() => {
		if (!open) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setActiveTab(0);
	}, [open]);

	return (
		<AppModal open={open} title={channel?.name ?? 'Channel Members'} onClose={onClose} cancelText="Close" maxWidth="sm">
			<Tabs value={activeTab} onChange={(_, value: number) => setActiveTab(value)} sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
				<Tab label="Description" />
				<Tab label={`Members (${channel?.members.length ?? 0})`} />
			</Tabs>
			{activeTab === 0 && (
				<Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
					<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
						{channel?.description?.trim() || 'No description added yet.'}
					</Typography>
				</Box>
			)}
			{activeTab === 1 && (
				<Stack spacing={2}>
					<List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
						{channel?.members.map((member, index) => (
							<Fragment key={member.user._id}>
								<ListItemButton>
									<ListItemAvatar>
										<Badge
											overlap="circular"
											variant="dot"
											anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
											sx={{ '& .MuiBadge-badge': { bgcolor: 'success.main', border: '2px solid white' } }}
										>
											<Avatar src={member.user.avatar}>{member.user.name[0]}</Avatar>
										</Badge>
									</ListItemAvatar>
									<ListItemText primary={member.user.name} secondary={`${member.user.role} - Online status active`} />
									<Chip label={member.role} size="small" variant="outlined" />
									{canManage && member.role !== 'Admin' && member.user._id !== currentUserId && (
										<IconButton color="error" onClick={() => onRemove(member.user._id, member.user.name)}>
											<CloseIcon />
										</IconButton>
									)}
								</ListItemButton>
								{channel && index < channel.members.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
							</Fragment>
						))}
					</List>
					{canManage && pendingRequests.length > 0 && (
						<Box>
							<Typography sx={{ fontWeight: 900, mb: 1 }}>Pending Requests</Typography>
							<List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
								{pendingRequests.map((request, index) => (
									<Fragment key={request.user._id}>
										<ListItemButton>
											<ListItemAvatar>
												<Avatar src={request.user.avatar}>{request.user.name[0]}</Avatar>
											</ListItemAvatar>
											<ListItemText primary={request.user.name} secondary={request.user.role} />
											<Button size="small" variant="contained" onClick={() => void onApprove(request.user._id)}>
												Approve
											</Button>
										</ListItemButton>
										{index < pendingRequests.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
									</Fragment>
								))}
							</List>
						</Box>
					)}
				</Stack>
			)}
		</AppModal>
	);
};

const GroupChatPage = () => {
	const { user } = useAuth();
	const { socket } = useChat();
	const [channels, setChannels] = useState<IGroupChatChannel[]>([]);
	const [discoverChannels, setDiscoverChannels] = useState<IGroupChatChannel[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<IGroupChatChannel | null>(null);
	const [messages, setMessages] = useState<IGroupChatMessage[]>([]);
	const [typingUser, setTypingUser] = useState<IGroupChatTypingEvent | null>(null);
	const [channelSearch, setChannelSearch] = useState('');
	const [messageSearch, setMessageSearch] = useState('');
	const [input, setInput] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [loadingChannels, setLoadingChannels] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [sending, setSending] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [addMembersOpen, setAddMembersOpen] = useState(false);
	const [membersOpen, setMembersOpen] = useState(false);
	const [uploadTrayDismissed, setUploadTrayDismissed] = useState(false);
	const [confirmAction, setConfirmAction] = useState<GroupChatConfirmAction | null>(null);
	const [confirmingAction, setConfirmingAction] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const isPlatformAdmin = isAdminRole(user?.role);
	const isCreatorSelected = Boolean(selectedChannel && selectedChannel.creator._id === user?._id);

	const canManageSelected = Boolean(
		selectedChannel &&
		(isPlatformAdmin || selectedChannel.members.some((member) => member.user._id === user?._id && member.role === 'Admin')),
	);

	const loadChannels = () => {
		setLoadingChannels(true);
		Promise.all([
			groupChatService.getChannels({ search: channelSearch || undefined }),
			groupChatService.discoverChannels({ search: channelSearch || undefined }),
		])
			.then(([ownedRes, discoverRes]) => {
				const nextChannels = ownedRes.data ?? [];
				setChannels(nextChannels);
				setDiscoverChannels(discoverRes.data ?? []);
				if (selectedChannel) {
					const updated = nextChannels.find((channel) => channel._id === selectedChannel._id);
					if (updated) setSelectedChannel(updated);
				} else if (nextChannels[0]) {
					setSelectedChannel(nextChannels[0]);
				}
			})
			.finally(() => setLoadingChannels(false));
	};

	useEffect(() => {
		const timeout = setTimeout(loadChannels, 250);
		return () => clearTimeout(timeout);
	}, [channelSearch]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!selectedChannel) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setTypingUser(null);
		setMessageSearch('');
		setLoadingMessages(true);
		socket?.emit('groupChat:joinRoom', { channelId: selectedChannel._id });
		groupChatService
			.getMessages(selectedChannel._id)
			.then((res) => setMessages(res.data ?? []))
			.finally(() => setLoadingMessages(false));
		groupChatService.markRead(selectedChannel._id).then(() => {
			setChannels((current) => current.map((channel) => (
				channel._id === selectedChannel._id
					? { ...channel, members: channel.members.map((member) => member.user._id === user?._id ? { ...member, unreadCount: 0 } : member) }
					: channel
			)));
		});
	}, [selectedChannel?._id]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, typingUser]);

	useEffect(() => {
		if (!socket) return;
		const onMessage = (message: IGroupChatMessage) => {
			if (selectedChannel?._id === message.channel) {
				setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
				if (message.sender !== user?._id) {
					setTypingUser(null);
					void groupChatService.markRead(message.channel);
				}
			}
		};
		const onChannelUpdated = (channel: IGroupChatChannel) => {
			setChannels((current) => {
				const exists = current.some((item) => item._id === channel._id);
				const next = exists ? current.map((item) => item._id === channel._id ? channel : item) : [channel, ...current];
				return next.filter((item) => isPlatformAdmin || (!item.isArchived && !item.isBlocked));
			});
			setSelectedChannel((current) => current?._id === channel._id ? channel : current);
		};
		const onTyping = (event: IGroupChatTypingEvent) => {
			if (event.userId === user?._id || event.channelId !== selectedChannel?._id) return;
			setTypingUser(event.isTyping ? event : null);
		};
		socket.on('groupChat:message', onMessage);
		socket.on('groupChat:channelUpdated', onChannelUpdated);
		socket.on('groupChat:typing', onTyping);
		return () => {
			socket.off('groupChat:message', onMessage);
			socket.off('groupChat:channelUpdated', onChannelUpdated);
			socket.off('groupChat:typing', onTyping);
		};
	}, [socket, selectedChannel?._id, user?._id, isPlatformAdmin]);

	const emitTyping = (isTyping: boolean) => {
		if (!selectedChannel?._id) return;
		socket?.emit('groupChat:typing', { channelId: selectedChannel._id, isTyping });
	};

	const handleInputChange = (value: string) => {
		setInput(value);
		emitTyping(value.trim().length > 0);
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200);
	};

	const addFiles = (selectedFiles: FileList | null) => {
		if (!selectedFiles) return;
		setFiles((current) => [...current, ...Array.from(selectedFiles)]);
	};

	const openFilePicker = (accept: string) => {
		if (!fileInputRef.current) return;
		setUploadTrayDismissed(true);
		fileInputRef.current.accept = accept;
		fileInputRef.current.click();
	};

	const sendMessage = async () => {
		if (!selectedChannel || (!input.trim() && files.length === 0)) return;
		setSending(true);
		try {
			const data = new FormData();
			data.append('content', input.trim());
			files.forEach((file) => data.append('files', file));
			await groupChatService.createMessage(selectedChannel._id, data);
			setInput('');
			setFiles([]);
			emitTyping(false);
		} finally {
			setSending(false);
		}
	};

	const joinChannel = async (channel: IGroupChatChannel) => {
		const res = await groupChatService.joinChannel(channel._id);
		if (res.data) {
			setChannels((current) => [res.data as IGroupChatChannel, ...current.filter((item) => item._id !== channel._id)]);
			setSelectedChannel(res.data);
		}
		toast.success(channel.type === 'Private' ? 'Join request sent' : 'Joined channel');
	};

	const updateSelectedChannel = (channel: IGroupChatChannel) => {
		setSelectedChannel(channel);
		setChannels((current) => {
			const exists = current.some((item) => item._id === channel._id);
			return exists ? current.map((item) => item._id === channel._id ? channel : item) : [channel, ...current];
		});
	};

	const archiveSelected = async () => {
		if (!selectedChannel) return;
		await groupChatService.archiveChannel(selectedChannel._id);
		setChannels((current) => current.filter((channel) => channel._id !== selectedChannel._id));
		setSelectedChannel(null);
		toast.success('Channel archived');
	};

	const blockSelected = async () => {
		if (!selectedChannel) return;
		const res = await groupChatService.toggleBlockChannel(selectedChannel._id);
		if (res.data) updateSelectedChannel(res.data);
	};

	const leaveSelected = async () => {
		if (!selectedChannel) return;
		await groupChatService.leaveChannel(selectedChannel._id);
		setChannels((current) => current.filter((channel) => channel._id !== selectedChannel._id));
		setSelectedChannel(null);
		toast.success('Left channel');
	};

	const confirmDestructiveAction = async () => {
		if (!confirmAction) return;
		setConfirmingAction(true);
		try {
			if (confirmAction.type === 'archiveChannel') {
				await archiveSelected();
			} else if (confirmAction.type === 'leaveChannel') {
				await leaveSelected();
			} else if (confirmAction.type === 'removeMember' && selectedChannel) {
				const res = await groupChatService.removeMember(selectedChannel._id, confirmAction.userId);
				if (res.data) updateSelectedChannel(res.data);
				toast.success('Member removed');
			}
			setConfirmAction(null);
		} finally {
			setConfirmingAction(false);
		}
	};

	const visibleMessages = useMemo(() => {
		const search = messageSearch.trim().toLowerCase();
		if (!search) return messages;
		return messages.filter((message) => [message.content, message.senderName, message.senderRole].join(' ').toLowerCase().includes(search));
	}, [messageSearch, messages]);

	const ownedOrJoinedIds = new Set(channels.map((channel) => channel._id));
	const joinableChannels = discoverChannels.filter((channel) => !ownedOrJoinedIds.has(channel._id));
	const selectedActions: ItemAction[] = [
		...(isCreatorSelected || isPlatformAdmin ? [{ label: 'Edit', icon: <EditIcon />, onClick: () => setEditOpen(true) }] : []),
		...(selectedChannel && selectedChannel.creator._id !== user?._id && !isPlatformAdmin ? [{ label: 'Leave', icon: <ExitToAppIcon />, onClick: () => setConfirmAction({ type: 'leaveChannel', channelName: selectedChannel.name }) }] : []),
		...(isCreatorSelected || isPlatformAdmin ? [{ label: 'Delete', icon: <DeleteIcon />, color: 'error' as const, onClick: () => selectedChannel && setConfirmAction({ type: 'archiveChannel', channelName: selectedChannel.name }) }] : []),
		...(isPlatformAdmin ? [{ label: selectedChannel?.isBlocked ? 'Unblock channel' : 'Block channel', icon: <BlockIcon />, onClick: () => void blockSelected() }] : []),
	];
	const confirmTitle = confirmAction?.type === 'leaveChannel'
		? 'Leave channel'
		: confirmAction?.type === 'removeMember'
			? 'Remove member'
			: 'Delete channel';
	const confirmText = confirmAction?.type === 'leaveChannel'
		? 'Leave'
		: confirmAction?.type === 'removeMember'
			? 'Remove'
			: 'Delete';
	const confirmMessage = confirmAction?.type === 'leaveChannel'
		? `Are you sure you want to leave "${confirmAction.channelName}"?`
		: confirmAction?.type === 'removeMember'
			? `Are you sure you want to remove ${confirmAction.userName} from this channel?`
			: confirmAction
				? `Are you sure you want to delete "${confirmAction.channelName}"? This will archive the channel.`
				: undefined;

	return (
		<Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', bgcolor: '#f5f7fb' }}>
			<Box sx={{ width: 320, flexShrink: 0, bgcolor: '#fff', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ p: 2, background: HEADER_GRADIENT, color: '#fff' }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
						<GroupsIcon />
						<Typography sx={{ fontWeight: 950 }}>Create Channel</Typography>
					</Stack>
					<TextField
						fullWidth
						size="small"
						placeholder="Search channels..."
						value={channelSearch}
						onChange={(event) => setChannelSearch(event.target.value)}
						slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'rgba(255,255,255,0.75)' }} /></InputAdornment> } }}
						sx={{
							'& .MuiOutlinedInput-root': {
								bgcolor: 'rgba(255,255,255,0.16)',
								color: '#fff',
								borderRadius: 2,
								'& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
							},
							'& input::placeholder': { color: 'rgba(255,255,255,0.75)', opacity: 1 },
						}}
					/>
				</Box>
				<Box sx={{ p: 1.5 }}>
					<Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
						Create Channel
					</Button>
				</Box>
				<Divider />
				<Box sx={{ flex: 1, overflowY: 'auto' }}>
					{loadingChannels ? (
						<Box sx={{ display: 'grid', placeItems: 'center', py: 5 }}><CircularProgress size={28} /></Box>
					) : (
						<>
							<Typography variant="caption" sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'block', fontWeight: 900, color: 'text.secondary' }}>
								My Channels
							</Typography>
							<List disablePadding>
								{channels.map((channel, index) => {
									const selected = selectedChannel?._id === channel._id;
									const unread = getMemberUnread(channel, user?._id);
									return (
										<Fragment key={channel._id}>
											<ListItemButton selected={selected} onClick={() => setSelectedChannel(channel)} sx={{ borderLeft: '4px solid', borderLeftColor: selected ? 'primary.main' : 'transparent' }}>
												<ListItemAvatar>
													<Badge badgeContent={unread} color="error" invisible={unread === 0}>
														<Avatar sx={{ bgcolor: channel.type === 'Private' ? 'warning.main' : 'primary.main' }}>
															{channel.type === 'Private' ? <LockIcon /> : <PublicIcon />}
														</Avatar>
													</Badge>
												</ListItemAvatar>
												<ListItemText
													primary={<Typography noWrap sx={{ fontWeight: 900 }}>{channel.name}</Typography>}
													secondary={<Typography noWrap variant="caption">{getMemberCountLabel(channel)}</Typography>}
												/>
											</ListItemButton>
											{index < channels.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
										</Fragment>
									);
								})}
							</List>
							{joinableChannels.length > 0 && (
								<>
									<Divider sx={{ my: 1 }} />
									<Typography variant="caption" sx={{ px: 2, pt: 2, pb: 0.5, display: 'block', fontWeight: 900, color: 'text.secondary' }}>
										Discover Channels
									</Typography>
									<List disablePadding>
										{joinableChannels.map((channel, index) => (
											<Fragment key={channel._id}>
												<ListItemButton onClick={() => void joinChannel(channel)}>
													<ListItemAvatar>
														<Avatar sx={{ bgcolor: channel.type === 'Private' ? 'warning.main' : 'success.main' }}>
															{channel.type === 'Private' ? <LockIcon /> : <PublicIcon />}
														</Avatar>
													</ListItemAvatar>
													<ListItemText
														primary={<Typography noWrap sx={{ fontWeight: 900 }}>{channel.name}</Typography>}
														secondary={<Typography noWrap variant="caption">{getMemberCountLabel(channel)}</Typography>}
													/>
												</ListItemButton>
												{index < joinableChannels.length - 1 && <Divider component="li" sx={{ ml: 9 }} />}
											</Fragment>
										))}
									</List>
								</>
							)}
						</>
					)}
				</Box>
			</Box>

			<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
				{selectedChannel ? (
					<>
						<Box sx={{ px: 3, py: 1.75, background: HEADER_GRADIENT, color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5 }}>
							<Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>{selectedChannel.name[0]}</Avatar>
							<Box sx={{ minWidth: 0, cursor: 'pointer' }} onClick={() => setMembersOpen(true)}>
								<Typography sx={{ fontWeight: 950 }} noWrap>{selectedChannel.name}</Typography>
								<Typography sx={{ fontSize: 12, opacity: 0.86 }}>{selectedChannel.members.length} members</Typography>
							</Box>
							<Chip size="small" label={selectedChannel.type} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800 }} />
							{selectedChannel.isBlocked && <Chip size="small" label="Blocked" color="warning" />}
							<Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
								{canManageSelected && (
									<Button
										variant="contained"
										color="inherit"
										size="small"
										startIcon={<GroupAddIcon />}
										onClick={() => setAddMembersOpen(true)}
										sx={{ color: 'primary.main', fontWeight: 900, textTransform: 'none' }}
									>
										Add Members
									</Button>
								)}
								<ItemActionMenu
									actions={selectedActions}
									iconButtonSx={{
										color: '#fff',
										'&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
									}}
								/>
							</Box>
						</Box>
						<Box sx={{ px: 2, py: 1.25, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
							<TextField
								fullWidth
								size="small"
								placeholder="Search messages..."
								value={messageSearch}
								onChange={(event) => setMessageSearch(event.target.value)}
								slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> } }}
							/>
						</Box>
						<Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#f7f8fc' }}>
							{loadingMessages ? (
								<Box sx={{ display: 'grid', placeItems: 'center', pt: 8 }}><CircularProgress /></Box>
							) : visibleMessages.length === 0 ? (
								<Typography color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>No messages yet.</Typography>
							) : (
								<Stack spacing={1.5}>
									{visibleMessages.map((message) => {
										const mine = message.sender === user?._id;
										const imageOnlyMessage = !message.content && message.attachments.length > 0 && message.attachments.every((file) => isImage(file.mimeType));
										return (
											<Stack
												key={message._id}
												direction={mine ? 'row-reverse' : 'row'}
												spacing={1}
												sx={{ alignItems: 'flex-end', justifyContent: mine ? 'flex-start' : 'flex-start' }}
											>
												<Avatar
													src={message.senderAvatar}
													sx={{
														width: 32,
														height: 32,
														bgcolor: avatarColor(message.senderRole),
														fontSize: 13,
														fontWeight: 700,
														flexShrink: 0,
													}}
												>
													{message.senderName[0]?.toUpperCase()}
												</Avatar>
												<Box sx={{ maxWidth: '72%' }}>
													<Typography
														variant="caption"
														sx={{
															mb: 0.4,
															display: 'block',
															textAlign: mine ? 'right' : 'left',
															color: 'text.secondary',
															fontSize: 11,
														}}
													>
														{mine ? (
															'You'
														) : (
															<>
																{message.senderName}{' '}
																<Box
																	component="span"
																	sx={{
																		px: 0.75,
																		py: 0.1,
																		borderRadius: 1,
																		bgcolor: avatarColor(message.senderRole),
																		color: '#fff',
																		fontSize: 9,
																		fontWeight: 600,
																		verticalAlign: 'middle',
																	}}
																>
																	{message.senderRole}
																</Box>
															</>
														)}
														{' · '}
														{formatTime(message.createdAt)}
													</Typography>
													<Paper
														elevation={0}
														sx={{
															p: imageOnlyMessage ? 0 : 1.25,
															borderRadius: imageOnlyMessage ? 0 : mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
															color: mine && !imageOnlyMessage ? '#fff' : 'text.primary',
															background: imageOnlyMessage ? 'transparent' : mine ? SENT_GRADIENT : '#fff',
															boxShadow: imageOnlyMessage ? 'none' : mine ? '0 2px 10px rgba(37, 99, 235, 0.28)' : '0 1px 4px rgba(0,0,0,0.08)',
														}}
													>
														{message.content && <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.5 }}>{message.content}</Typography>}
														{message.attachments.length > 0 && (
															<Stack spacing={0.75} sx={{ mt: message.content ? 1 : 0 }}>
																{message.attachments.map((file) => (
																	<Box key={file.publicId}>
																		{isImage(file.mimeType) ? (
																			<Box
																				component="img"
																				src={file.url}
																				alt={file.fileName}
																				sx={{
																					maxWidth: 320,
																					maxHeight: 260,
																					borderRadius: 2,
																					display: 'block',
																					objectFit: 'cover',
																					border: '1px solid',
																					borderColor: 'rgba(15,23,42,0.08)',
																					boxShadow: '0 10px 28px rgba(15,23,42,0.16)',
																				}}
																			/>
																		) : (
																			<Button href={file.url} target="_blank" rel="noreferrer" variant={mine ? 'outlined' : 'contained'} size="small" startIcon={isPdf(file.mimeType) ? <DescriptionIcon /> : <InsertDriveFileIcon />}>
																				{file.fileName}
																			</Button>
																		)}
																	</Box>
																))}
															</Stack>
														)}
													</Paper>
												</Box>
											</Stack>
										);
									})}
									{typingUser && <TypingIndicator typingUser={{ conversationId: typingUser.channelId, userId: typingUser.userId, userName: typingUser.userName, userRole: typingUser.userRole, isTyping: typingUser.isTyping }} compact />}
									<div ref={messagesEndRef} />
								</Stack>
							)}
						</Box>
						<Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>
							{files.length > 0 && (
								<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}>
									{files.map((file, index) => (
										<SelectedChatFilePreview
											key={`${file.name}-${index}`}
											file={file}
											onRemove={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
										/>
									))}
								</Stack>
							)}
							<Stack direction="row" spacing={1}>
								<Box
									className={uploadTrayDismissed ? 'upload-picker is-dismissed' : 'upload-picker'}
									onMouseLeave={() => setUploadTrayDismissed(false)}
									sx={{
										position: 'relative',
										display: 'flex',
										alignItems: 'center',
										'&:not(.is-dismissed):hover .group-upload-actions, &:not(.is-dismissed):focus-within .group-upload-actions': {
											opacity: 1,
											visibility: 'visible',
											transform: 'translate(0, 0)',
											pointerEvents: 'auto',
										},
										'&:not(.is-dismissed):hover .group-upload-bridge, &:not(.is-dismissed):focus-within .group-upload-bridge': {
											display: 'block',
										},
									}}
								>
									<IconButton
										aria-label="Show upload options"
										sx={{
											bgcolor: 'grey.100',
											'&:hover': { bgcolor: 'grey.200' },
										}}
									>
										<AddIcon />
									</IconButton>
									<Box
										className="group-upload-bridge"
										sx={{
											display: 'none',
											position: 'absolute',
											left: 0,
											bottom: 36,
											width: 172,
											height: 34,
											zIndex: 1,
										}}
									/>
									<Stack
										className="group-upload-actions"
										direction="row"
										spacing={0.75}
										sx={{
											position: 'absolute',
											left: 4,
											bottom: 64,
											transform: 'translate(-6px, 8px)',
											opacity: 0,
											visibility: 'hidden',
											pointerEvents: 'none',
											transition: 'all 0.18s ease',
											p: 0.75,
											borderRadius: 5,
											bgcolor: '#fff',
											border: '1px solid',
											borderColor: 'divider',
											boxShadow: '0 10px 26px rgba(15,23,42,0.14)',
											zIndex: 2,
										}}
									>
										<Tooltip title="Upload image">
											<IconButton size="medium" color="primary" onClick={() => openFilePicker('image/*')} sx={{ width: 40, height: 40 }}>
												<ImageIcon sx={{ fontSize: 23 }} />
											</IconButton>
										</Tooltip>
										<Tooltip title="Upload PDF">
											<IconButton size="medium" color="error" onClick={() => openFilePicker('application/pdf')} sx={{ width: 40, height: 40 }}>
												<DescriptionIcon sx={{ fontSize: 23 }} />
											</IconButton>
										</Tooltip>
										<Tooltip title="Upload files/documents">
											<IconButton size="medium" color="success" onClick={() => openFilePicker('*/*')} sx={{ width: 40, height: 40 }}>
												<InsertDriveFileIcon sx={{ fontSize: 23 }} />
											</IconButton>
										</Tooltip>
									</Stack>
								</Box>
								<TextField fullWidth placeholder="Type a message..." value={input} onChange={(event) => handleInputChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} />
								<IconButton color="primary" disabled={sending || (!input.trim() && files.length === 0)} onClick={() => void sendMessage()}><SendIcon /></IconButton>
							</Stack>
							<input ref={fileInputRef} hidden multiple type="file" onChange={(event) => addFiles(event.target.files)} />
						</Box>
					</>
				) : (
					<Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
						<Typography color="text.secondary">Create or select a channel to start chatting.</Typography>
					</Box>
				)}
			</Box>

			<ChannelModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={(channel) => {
				setChannels((current) => [channel, ...current]);
				setSelectedChannel(channel);
			}} />
			<ChannelModal
				open={editOpen}
				channel={selectedChannel}
				onClose={() => setEditOpen(false)}
				onSaved={updateSelectedChannel}
			/>
			<AddMembersModal open={addMembersOpen} channel={selectedChannel} onClose={() => setAddMembersOpen(false)} onSaved={updateSelectedChannel} />
			<MembersModal
				open={membersOpen}
				channel={selectedChannel}
				currentUserId={user?._id}
				canManage={canManageSelected}
				onClose={() => setMembersOpen(false)}
				onApprove={async (userId) => {
					if (!selectedChannel) return;
					const res = await groupChatService.approveJoinRequest(selectedChannel._id, userId);
					if (res.data) updateSelectedChannel(res.data);
				}}
				onRemove={(userId, userName) => setConfirmAction({ type: 'removeMember', userId, userName })}
			/>
			<DestructiveActionConfirmModal
				open={Boolean(confirmAction)}
				title={confirmTitle}
				confirmText={confirmText}
				confirming={confirmingAction}
				onClose={() => setConfirmAction(null)}
				onConfirm={() => void confirmDestructiveAction()}
			>
				{confirmMessage}
			</DestructiveActionConfirmModal>
		</Box>
	);
};

export default GroupChatPage;
