import { useEffect, useRef, useState } from 'react';
import {
	Avatar,
	Badge,
	Box,
	CircularProgress,
	Fab,
	IconButton,
	InputAdornment,
	Paper,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { chatService } from '../../services/chat.service';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/useAuth';
import type { IChatConversation, IChatMessage } from '../../types';

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

export default function ChatWidget() {
	const { user } = useAuth();
	const { socket, totalUnread, clearUnread } = useChat();
	const [open, setOpen] = useState(false);
	const [conversation, setConversation] = useState<IChatConversation | null>(null);
	const [messages, setMessages] = useState<IChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		setLoading(true);
		chatService
			.getConversations()
			.then(async (res) => {
				const conv = res.data as IChatConversation;
				setConversation(conv);
				if (conv?._id) {
					const msgsRes = await chatService.getMessages(conv._id);
					setMessages(msgsRes.data ?? []);
					socket?.emit('chat:markRead', { conversationId: conv._id });
					clearUnread();
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, [open]);

	useEffect(() => {
		if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, open]);

	useEffect(() => {
		if (!socket || !conversation) return;

		const onMessage = (msg: IChatMessage) => {
			if (msg.conversationId !== conversation._id) return;
			setMessages((prev) => {
				if (prev.some((m) => m._id === msg._id)) return prev;
				return [...prev, msg];
			});
			if (open) {
				socket.emit('chat:markRead', { conversationId: conversation._id });
				clearUnread();
			}
		};

		socket.on('chat:message', onMessage);
		return () => {
			socket.off('chat:message', onMessage);
		};
	}, [socket, conversation?._id, open]);

	const handleSend = () => {
		if (!input.trim()) return;
		socket?.emit('chat:send', { content: input.trim() });
		setInput('');
	};

	const handleOpen = () => {
		setOpen(true);
		clearUnread();
	};

	return (
		<>
			{open && (
				<Paper
					elevation={12}
					sx={{
						position: 'fixed',
						bottom: 92,
						right: 24,
						width: 370,
						height: 500,
						zIndex: 1300,
						borderRadius: 3,
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
						border: '1px solid',
						borderColor: 'rgba(99,102,241,0.2)',
					}}
				>
					{/* Header */}
					<Box
						sx={{
							px: 2,
							py: 1.5,
							background: HEADER_GRADIENT,
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Box
								sx={{
									bgcolor: 'rgba(255,255,255,0.2)',
									borderRadius: '50%',
									p: 0.5,
									display: 'flex',
								}}
							>
								<SupportAgentIcon sx={{ fontSize: 18 }} />
							</Box>
							<Box>
								<Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
									Support Chat
								</Typography>
								<Typography sx={{ fontSize: 11, opacity: 0.85 }}>
									We typically reply within a few hours
								</Typography>
							</Box>
						</Box>
						<Tooltip title='Close'>
							<IconButton size='small' sx={{ color: '#fff', opacity: 0.85 }} onClick={() => setOpen(false)}>
								<CloseIcon fontSize='small' />
							</IconButton>
						</Tooltip>
					</Box>

					{/* Messages */}
					<Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5, bgcolor: '#f8f7ff' }}>
						{loading ? (
							<Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
								<CircularProgress size={24} sx={{ color: '#6366f1' }} />
							</Box>
						) : messages.length === 0 ? (
							<Box sx={{ textAlign: 'center', mt: 5 }}>
								<Box
									sx={{
										width: 56,
										height: 56,
										borderRadius: '50%',
										background: HEADER_GRADIENT,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										mx: 'auto',
										mb: 1.5,
									}}
								>
									<SupportAgentIcon sx={{ color: '#fff', fontSize: 28 }} />
								</Box>
								<Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>
									Hi there! 👋
								</Typography>
								<Typography variant='caption' color='text.secondary'>
									Send us a message and we'll get back to you.
								</Typography>
							</Box>
						) : (
							messages.map((msg) => {
								const isMe = msg.senderId === user?._id;
								return (
									<Box
										key={msg._id}
										sx={{
											display: 'flex',
											flexDirection: isMe ? 'row-reverse' : 'row',
											alignItems: 'flex-end',
											gap: 0.75,
											mb: 1.5,
										}}
									>
										<Avatar
											src={msg.senderAvatar}
											sx={{
												width: 28,
												height: 28,
												bgcolor: avatarColor(msg.senderRole),
												fontSize: 12,
												flexShrink: 0,
											}}
										>
											{msg.senderName?.[0]?.toUpperCase()}
										</Avatar>
										<Box sx={{ maxWidth: '75%' }}>
											<Typography
												variant='caption'
												color='text.secondary'
												sx={{
													mb: 0.3,
													display: 'block',
													textAlign: isMe ? 'right' : 'left',
													fontSize: 10,
												}}
											>
												{isMe ? 'You' : `${msg.senderName} · ${msg.senderRole}`}{' '}
												· {formatTime(msg.createdAt)}
											</Typography>
											<Box
												sx={{
													px: 1.5,
													py: 0.85,
													borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
													background: isMe ? SENT_GRADIENT : '#fff',
													color: isMe ? '#fff' : 'text.primary',
													boxShadow: isMe
														? '0 2px 8px rgba(99,102,241,0.35)'
														: '0 1px 4px rgba(0,0,0,0.1)',
												}}
											>
												<Typography sx={{ fontSize: 13, lineHeight: 1.45 }}>
													{msg.content}
												</Typography>
											</Box>
										</Box>
									</Box>
								);
							})
						)}
						<div ref={messagesEndRef} />
					</Box>

					{/* Input */}
					<Box
						sx={{
							px: 1.5,
							py: 1,
							borderTop: '1px solid',
							borderColor: 'rgba(99,102,241,0.15)',
							bgcolor: '#fff',
						}}
					>
						<TextField
							fullWidth
							size='small'
							placeholder='Type a message...'
							value={input}
							onChange={(e) => setInput(e.target.value)}
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
													width: 28,
													height: 28,
												}}
											>
												<SendIcon sx={{ fontSize: 15 }} />
											</IconButton>
										</InputAdornment>
									),
								},
							}}
						/>
					</Box>
				</Paper>
			)}

			{/* FAB */}
			<Badge badgeContent={totalUnread} color='error' invisible={totalUnread === 0}>
				<Fab
					sx={{
						position: 'fixed',
						bottom: 24,
						right: 24,
						zIndex: 1300,
						background: HEADER_GRADIENT,
						color: '#fff',
						boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
						'&:hover': {
							background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
							boxShadow: '0 6px 20px rgba(99,102,241,0.6)',
						},
					}}
					onClick={open ? () => setOpen(false) : handleOpen}
				>
					{open ? <CloseIcon /> : <ChatIcon />}
				</Fab>
			</Badge>
		</>
	);
}
