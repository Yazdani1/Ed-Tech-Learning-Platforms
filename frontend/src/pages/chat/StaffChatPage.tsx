import { useEffect, useRef, useState } from 'react';
import {
	Avatar,
	Badge,
	Box,
	CircularProgress,
	IconButton,
	InputAdornment,
	List,
	ListItemButton,
	TextField,
	Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SearchIcon from '@mui/icons-material/Search';
import { chatService } from '../../services/chat.service';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/useAuth';
import type { IChatConversation, IChatMessage, IChatTypingEvent } from '../../types';
import TypingIndicator from '../../components/chat/TypingIndicator';

const HEADER_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
const SENT_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';

const ROLE_COLORS: Record<string, string> = {
	'Super Admin': '#f59e0b',
	Admin: '#ef4444',
	Moderator: '#10b981',
	Teacher: '#3b82f6',
	Student: '#8b5cf6',
};

function avatarColor(role: string) {
	return ROLE_COLORS[role] ?? '#6366f1';
}

function formatTime(iso: string) {
	return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
	const d = new Date(iso);
	const now = new Date();
	if (d.toDateString() === now.toDateString()) return formatTime(iso);
	return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function StaffChatPage() {
	const { user } = useAuth();
	const { socket, clearUnread } = useChat();
	const [conversations, setConversations] = useState<IChatConversation[]>([]);
	const [selectedConv, setSelectedConv] = useState<IChatConversation | null>(null);
	const [messages, setMessages] = useState<IChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [loadingConvs, setLoadingConvs] = useState(true);
	const [loadingMsgs, setLoadingMsgs] = useState(false);
	const [search, setSearch] = useState('');
	const [messageSearch, setMessageSearch] = useState('');
	const [typingUser, setTypingUser] = useState<IChatTypingEvent | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		setLoadingConvs(true);
		chatService
			.getConversations()
			.then((res) => setConversations((res.data as IChatConversation[]) ?? []))
			.catch(() => {})
			.finally(() => setLoadingConvs(false));
	}, []);

	useEffect(() => {
		clearUnread();
	}, []);

	useEffect(() => {
		if (!selectedConv) return;
		setTypingUser(null);
		setMessageSearch('');
		setLoadingMsgs(true);
		chatService
			.getMessages(selectedConv._id)
			.then((res) => setMessages(res.data ?? []))
			.catch(() => {})
			.finally(() => setLoadingMsgs(false));
		socket?.emit('chat:markRead', { conversationId: selectedConv._id });
		setConversations((prev) =>
			prev.map((c) => (c._id === selectedConv._id ? { ...c, unreadByStaff: 0 } : c)),
		);
	}, [selectedConv?._id]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, typingUser]);

	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
			if (selectedConv?._id) {
				socket?.emit('chat:typing', { conversationId: selectedConv._id, isTyping: false });
			}
		};
	}, [socket, selectedConv?._id]);

	useEffect(() => {
		if (!socket) return;

		const onMessage = (msg: IChatMessage) => {
			if (selectedConv && msg.conversationId === selectedConv._id) {
				setMessages((prev) => {
					if (prev.some((m) => m._id === msg._id)) return prev;
					return [...prev, msg];
				});
				if (msg.senderId !== user?._id) setTypingUser(null);
				socket.emit('chat:markRead', { conversationId: selectedConv._id });
			}
		};

		const onConvUpdated = (conv: IChatConversation) => {
			setConversations((prev) => {
				const exists = prev.some((c) => c._id === conv._id);
				const updated = exists
					? prev.map((c) => (c._id === conv._id ? conv : c))
					: [conv, ...prev];
				return [...updated].sort(
					(a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
				);
			});
			if (selectedConv && conv._id === selectedConv._id) {
				setSelectedConv(conv);
				socket.emit('chat:markRead', { conversationId: conv._id });
			}
		};

		const onTyping = (event: IChatTypingEvent) => {
			if (event.userId === user?._id) return;
			if (!selectedConv || event.conversationId !== selectedConv._id) return;
			setTypingUser(event.isTyping ? event : null);
		};

		socket.on('chat:message', onMessage);
		socket.on('chat:conversationUpdated', onConvUpdated);
		socket.on('chat:typing', onTyping);
		return () => {
			socket.off('chat:message', onMessage);
			socket.off('chat:conversationUpdated', onConvUpdated);
			socket.off('chat:typing', onTyping);
		};
	}, [socket, selectedConv?._id, user?._id]);

	const emitTyping = (isTyping: boolean) => {
		if (!selectedConv?._id) return;
		socket?.emit('chat:typing', { conversationId: selectedConv._id, isTyping });
	};

	const handleInputChange = (value: string) => {
		setInput(value);
		emitTyping(value.trim().length > 0);
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
		typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200);
	};

	const handleSend = () => {
		if (!input.trim() || !selectedConv) return;
		emitTyping(false);
		socket?.emit('chat:send', { content: input.trim(), conversationId: selectedConv._id });
		setInput('');
	};

	const normalizedConversationSearch = search.trim().toLowerCase();
	const filteredConvs = conversations.filter((c) =>
		[c.student?.name, c.student?.email, c.lastMessage]
			.join(' ')
			.toLowerCase()
			.includes(normalizedConversationSearch),
	);
	const normalizedMessageSearch = messageSearch.trim().toLowerCase();
	const visibleMessages = normalizedMessageSearch
		? messages.filter((msg) =>
				[msg.content, msg.senderName, msg.senderRole]
					.join(' ')
					.toLowerCase()
					.includes(normalizedMessageSearch),
			)
		: messages;

	return (
		<Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', bgcolor: '#f5f4ff' }}>
			{/* Sidebar */}
			<Box
				sx={{
					width: 300,
					flexShrink: 0,
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
					bgcolor: '#fff',
					borderRight: '1px solid',
					borderColor: 'rgba(99,102,241,0.12)',
				}}
			>
				{/* Sidebar header */}
				<Box
					sx={{
						px: 2,
						py: 2,
						background: HEADER_GRADIENT,
						color: '#fff',
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
						<SupportAgentIcon sx={{ fontSize: 20 }} />
						<Typography sx={{ fontWeight: 700, fontSize: 15 }}>Support Inbox</Typography>
					</Box>
					<TextField
						size='small'
						fullWidth
						placeholder='Search students...'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{
							'& .MuiOutlinedInput-root': {
								bgcolor: 'rgba(255,255,255,0.15)',
								borderRadius: 2,
								color: '#fff',
								'& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
								'&:hover fieldset': { borderColor: 'rgba(255,255,255,0.6)' },
								'&.Mui-focused fieldset': { borderColor: '#fff' },
							},
							'& input::placeholder': { color: 'rgba(255,255,255,0.7)', opacity: 1 },
							'& input': { color: '#fff' },
						}}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position='start'>
										<SearchIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
									</InputAdornment>
								),
							},
						}}
					/>
				</Box>

				{/* Conversation list */}
				{loadingConvs ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
						<CircularProgress size={28} sx={{ color: '#6366f1' }} />
					</Box>
				) : filteredConvs.length === 0 ? (
					<Box sx={{ p: 3, textAlign: 'center' }}>
						<Typography variant='body2' color='text.secondary'>
							No conversations yet
						</Typography>
					</Box>
				) : (
					<List disablePadding sx={{ overflowY: 'auto', flex: 1 }}>
						{filteredConvs.map((conv) => {
							const isSelected = selectedConv?._id === conv._id;
							return (
								<ListItemButton
									key={conv._id}
									selected={isSelected}
									onClick={() => setSelectedConv(conv)}
									sx={{
										px: 2,
										py: 1.5,
										gap: 1.25,
										borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
										bgcolor: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent',
										'&:hover': { bgcolor: 'rgba(99,102,241,0.04)' },
									}}
								>
									<Badge
										badgeContent={conv.unreadByStaff}
										color='error'
										invisible={conv.unreadByStaff === 0}
										sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}
									>
										<Avatar
											src={conv.student?.avatar}
											sx={{
												width: 40,
												height: 40,
												bgcolor: avatarColor('Student'),
												fontSize: 15,
												fontWeight: 700,
											}}
										>
											{conv.student?.name?.[0]?.toUpperCase()}
										</Avatar>
									</Badge>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<Typography
												variant='body2'
												sx={{ fontWeight: conv.unreadByStaff > 0 ? 700 : 500, fontSize: 13 }}
												noWrap
											>
												{conv.student?.name ?? 'Student'}
											</Typography>
											{conv.lastMessageAt && (
												<Typography variant='caption' sx={{ color: 'text.disabled', fontSize: 10, flexShrink: 0, ml: 0.5 }}>
													{formatDate(conv.lastMessageAt)}
												</Typography>
											)}
										</Box>
										<Typography
											variant='caption'
											sx={{
												color: conv.unreadByStaff > 0 ? '#6366f1' : 'text.secondary',
												fontWeight: conv.unreadByStaff > 0 ? 600 : 400,
												display: 'block',
											}}
											noWrap
										>
											{conv.lastMessage || 'No messages yet'}
										</Typography>
									</Box>
								</ListItemButton>
							);
						})}
					</List>
				)}
			</Box>

			{/* Conversation panel */}
			{selectedConv ? (
				<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
					{/* Chat header */}
					<Box
						sx={{
							px: 3,
							py: 1.75,
							background: HEADER_GRADIENT,
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
							gap: 1.5,
						}}
					>
						<Avatar
							src={selectedConv.student?.avatar}
							sx={{ width: 38, height: 38, bgcolor: 'rgba(255,255,255,0.25)', fontWeight: 700 }}
						>
							{selectedConv.student?.name?.[0]?.toUpperCase()}
						</Avatar>
						<Box>
							<Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
								{selectedConv.student?.name}
							</Typography>
							<Typography sx={{ fontSize: 12, opacity: 0.8 }}>
								{selectedConv.student?.email}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ px: 2, py: 1.25, bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'rgba(99,102,241,0.12)' }}>
						<TextField
							fullWidth
							size='small'
							placeholder='Search messages...'
							value={messageSearch}
							onChange={(e) => setMessageSearch(e.target.value)}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 2,
									bgcolor: '#f8f7ff',
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#6366f1',
									},
								},
							}}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position='start'>
											<SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
										</InputAdornment>
									),
								},
							}}
						/>
					</Box>

					{/* Messages */}
					<Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2, bgcolor: '#f8f7ff' }}>
						{loadingMsgs ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', pt: 5 }}>
								<CircularProgress size={28} sx={{ color: '#6366f1' }} />
							</Box>
						) : messages.length === 0 ? (
							<Box sx={{ textAlign: 'center', mt: 8 }}>
								<ForumOutlinedIcon sx={{ fontSize: 48, color: '#c7c5f0', mb: 1 }} />
								<Typography variant='body2' color='text.secondary'>
									No messages yet. Start the conversation!
								</Typography>
							</Box>
						) : visibleMessages.length === 0 ? (
							<Box sx={{ textAlign: 'center', mt: 8 }}>
								<Typography variant='body2' color='text.secondary'>
									No messages match your search.
								</Typography>
							</Box>
						) : (
							visibleMessages.map((msg) => {
								const isMe = msg.senderId === user?._id;
								return (
									<Box
										key={msg._id}
										sx={{
											display: 'flex',
											flexDirection: isMe ? 'row-reverse' : 'row',
											alignItems: 'flex-end',
											gap: 1,
											mb: 1.75,
										}}
									>
										<Avatar
											src={msg.senderAvatar}
											sx={{
												width: 30,
												height: 30,
												bgcolor: avatarColor(msg.senderRole),
												fontSize: 12,
												fontWeight: 700,
												flexShrink: 0,
											}}
										>
											{msg.senderName?.[0]?.toUpperCase()}
										</Avatar>
										<Box sx={{ maxWidth: '68%' }}>
											<Typography
												variant='caption'
												sx={{
													mb: 0.35,
													display: 'block',
													textAlign: isMe ? 'right' : 'left',
													color: 'text.secondary',
													fontSize: 10,
												}}
											>
												{msg.senderName}
												{!isMe && (
													<Box
														component='span'
														sx={{
															ml: 0.5,
															px: 0.75,
															py: 0.1,
															borderRadius: 1,
															bgcolor: avatarColor(msg.senderRole),
															color: '#fff',
															fontSize: 9,
															fontWeight: 600,
														}}
													>
														{msg.senderRole}
													</Box>
												)}
												{' · '}
												{formatTime(msg.createdAt)}
											</Typography>
											<Box
												sx={{
													px: 1.5,
													py: 0.9,
													borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
													background: isMe ? SENT_GRADIENT : '#fff',
													color: isMe ? '#fff' : 'text.primary',
													boxShadow: isMe
														? '0 2px 8px rgba(99,102,241,0.35)'
														: '0 1px 4px rgba(0,0,0,0.08)',
												}}
											>
												<Typography sx={{ fontSize: 13.5, lineHeight: 1.5 }}>
													{msg.content}
												</Typography>
											</Box>
										</Box>
									</Box>
								);
							})
						)}
						{typingUser && !normalizedMessageSearch && (
							<TypingIndicator typingUser={typingUser} />
						)}
						<div ref={messagesEndRef} />
					</Box>

					{/* Input */}
					<Box
						sx={{
							px: 2,
							py: 1.25,
							borderTop: '1px solid',
							borderColor: 'rgba(99,102,241,0.12)',
							bgcolor: '#fff',
						}}
					>
						<TextField
							fullWidth
							size='small'
							placeholder={`Reply to ${selectedConv.student?.name ?? 'student'}...`}
							value={input}
							onChange={(e) => handleInputChange(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									handleSend();
								}
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: 3,
									'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
										borderColor: '#6366f1',
									},
								},
							}}
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position='end'>
											<IconButton
												size='small'
												onClick={handleSend}
												disabled={!input.trim()}
												sx={{
													bgcolor: input.trim() ? '#6366f1' : 'transparent',
													color: input.trim() ? '#fff' : 'text.disabled',
													'&:hover': { bgcolor: input.trim() ? '#4f46e5' : 'transparent' },
													transition: 'all 0.2s',
													width: 30,
													height: 30,
												}}
											>
												<SendIcon sx={{ fontSize: 16 }} />
											</IconButton>
										</InputAdornment>
									),
								},
							}}
						/>
					</Box>
				</Box>
			) : (
				<Box
					sx={{
						flex: 1,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'column',
						gap: 2,
					}}
				>
					<Box
						sx={{
							width: 80,
							height: 80,
							borderRadius: '50%',
							background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<ForumOutlinedIcon sx={{ fontSize: 40, color: '#8b8ef5' }} />
					</Box>
					<Typography variant='h6' sx={{ fontWeight: 700, color: 'text.secondary' }}>
						Select a conversation
					</Typography>
					<Typography variant='body2' color='text.disabled'>
						Choose a student from the left to view their messages
					</Typography>
				</Box>
			)}
		</Box>
	);
}
