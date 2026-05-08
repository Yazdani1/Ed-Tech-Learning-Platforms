import { useEffect, useRef, useState } from 'react';
import {
	Avatar,
	Box,
	CircularProgress,
	IconButton,
	InputAdornment,
	TextField,
	Typography,
} from '@mui/material';
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

export default function StudentChatPage({ embedded = false }: { embedded?: boolean }) {
	const { user } = useAuth();
	const { socket, clearUnread } = useChat();
	const [conversation, setConversation] = useState<IChatConversation | null>(null);
	const [messages, setMessages] = useState<IChatMessage[]>([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
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
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	useEffect(() => {
		if (!socket || !conversation) return;

		const onMessage = (msg: IChatMessage) => {
			if (msg.conversationId !== conversation._id) return;
			setMessages((prev) => {
				if (prev.some((m) => m._id === msg._id)) return prev;
				return [...prev, msg];
			});
			socket.emit('chat:markRead', { conversationId: conversation._id });
			clearUnread();
		};

		socket.on('chat:message', onMessage);
		return () => {
			socket.off('chat:message', onMessage);
		};
	}, [socket, conversation?._id]);

	const handleSend = () => {
		if (!input.trim()) return;
		socket?.emit('chat:send', { content: input.trim() });
		setInput('');
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				...(embedded ? { flex: 1, minHeight: 0 } : { height: 'calc(100vh - 64px)', p: 2 }),
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					flex: 1,
					overflow: 'hidden',
					borderRadius: 0.5,
					border: '1px solid',
					borderColor: 'rgba(99,102,241,0.15)',
					boxShadow: '0 4px 24px rgba(99,102,241,0.1)',
				}}
			>
				{/* Header */}
				<Box
					sx={{
						px: 3,
						py: 2,
						background: HEADER_GRADIENT,
						color: '#fff',
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
					}}
				>
					<Box
						sx={{
							width: 42,
							height: 42,
							borderRadius: '50%',
							bgcolor: 'rgba(255,255,255,0.2)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
						}}
					>
						<SupportAgentIcon sx={{ fontSize: 22 }} />
					</Box>
					<Box>
						<Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
							Support Chat
						</Typography>
						<Typography sx={{ fontSize: 12, opacity: 0.85 }}>
							Our team is here to help you
						</Typography>
					</Box>
					<Box
						sx={{
							ml: 'auto',
							display: 'flex',
							alignItems: 'center',
							gap: 0.75,
							bgcolor: 'rgba(255,255,255,0.15)',
							borderRadius: 5,
							px: 1.25,
							py: 0.5,
						}}
					>
						<Box
							sx={{
								width: 7,
								height: 7,
								borderRadius: '50%',
								bgcolor: '#4ade80',
								boxShadow: '0 0 6px #4ade80',
							}}
						/>
						<Typography sx={{ fontSize: 11, fontWeight: 600 }}>Online</Typography>
					</Box>
				</Box>

				{/* Messages */}
				<Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, bgcolor: '#f8f7ff' }}>
					{loading ? (
						<Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
							<CircularProgress size={30} sx={{ color: '#6366f1' }} />
						</Box>
					) : messages.length === 0 ? (
						<Box sx={{ textAlign: 'center', mt: 8 }}>
							<Box
								sx={{
									width: 72,
									height: 72,
									borderRadius: '50%',
									background: HEADER_GRADIENT,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									mx: 'auto',
									mb: 2,
									boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
								}}
							>
								<SupportAgentIcon sx={{ color: '#fff', fontSize: 34 }} />
							</Box>
							<Typography variant='subtitle1' sx={{ fontWeight: 700, color: '#6366f1', mb: 0.5 }}>
								Welcome to Support Chat! 👋
							</Typography>
							<Typography variant='body2' color='text.secondary'>
								Send us a message and we'll respond as soon as possible.
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
										gap: 1,
										mb: 2,
									}}
								>
									<Avatar
										src={msg.senderAvatar}
										sx={{
											width: 32,
											height: 32,
											bgcolor: avatarColor(msg.senderRole),
											fontSize: 13,
											fontWeight: 700,
											flexShrink: 0,
										}}
									>
										{msg.senderName?.[0]?.toUpperCase()}
									</Avatar>
									<Box sx={{ maxWidth: '70%' }}>
										<Typography
											variant='caption'
											sx={{
												mb: 0.4,
												display: 'block',
												textAlign: isMe ? 'right' : 'left',
												color: 'text.secondary',
												fontSize: 11,
											}}
										>
											{isMe ? (
												'You'
											) : (
												<>
													{msg.senderName}{' '}
													<Box
														component='span'
														sx={{
															px: 0.75,
															py: 0.1,
															borderRadius: 1,
															bgcolor: avatarColor(msg.senderRole),
															color: '#fff',
															fontSize: 9,
															fontWeight: 600,
															verticalAlign: 'middle',
														}}
													>
														{msg.senderRole}
													</Box>
												</>
											)}
											{' · '}
											{formatTime(msg.createdAt)}
										</Typography>
										<Box
											sx={{
												px: 1.75,
												py: 1,
												borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
												background: isMe ? SENT_GRADIENT : '#fff',
												color: isMe ? '#fff' : 'text.primary',
												boxShadow: isMe
													? '0 2px 10px rgba(99,102,241,0.4)'
													: '0 1px 4px rgba(0,0,0,0.08)',
											}}
										>
											<Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>
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
						px: 2,
						py: 1.5,
						borderTop: '1px solid',
						borderColor: 'rgba(99,102,241,0.12)',
						bgcolor: '#fff',
					}}
				>
					<TextField
						fullWidth
						size='small'
						placeholder='Type your message...'
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
								bgcolor: '#f8f7ff',
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
												width: 32,
												height: 32,
											}}
										>
											<SendIcon sx={{ fontSize: 17 }} />
										</IconButton>
									</InputAdornment>
								),
							},
						}}
					/>
				</Box>
			</Box>
		</Box>
	);
}
