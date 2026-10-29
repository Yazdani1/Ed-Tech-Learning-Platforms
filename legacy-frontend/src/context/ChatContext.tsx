import { type FC, createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { chatService } from '../services/chat.service';
import type { IChatConversation, IChatMessage } from '../types';

const SOCKET_URL = ((import.meta.env.VITE_API_URL as string) ?? 'http://localhost:5000/api').replace(
	/\/api$/,
	'',
);

const STAFF_ROLES = ['Super Admin', 'Admin', 'Moderator', 'Teacher'];

interface ChatContextType {
	socket: Socket | null;
	totalUnread: number;
	clearUnread: () => void;
}

const ChatContext = createContext<ChatContextType>({
	socket: null,
	totalUnread: 0,
	clearUnread: () => {},
});

interface ChatProviderProps {
	children: ReactNode;
}

export const ChatProvider: FC<ChatProviderProps> = ({ children }) => {
	const { user, isAuthenticated } = useAuth();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [totalUnread, setTotalUnread] = useState(0);

	const isStaff = user ? STAFF_ROLES.includes(user.role) : false;

	// Load initial unread count
	useEffect(() => {
		if (!isAuthenticated || !user) return;
		chatService
			.getConversations()
			.then((res) => {
				if (isStaff) {
					const convs = res.data as IChatConversation[];
					setTotalUnread(
						Array.isArray(convs) ? convs.reduce((sum, c) => sum + c.unreadByStaff, 0) : 0,
					);
				} else {
					const conv = res.data as IChatConversation;
					setTotalUnread(conv?.unreadByStudent ?? 0);
				}
			})
			.catch(() => {});
	}, [isAuthenticated, user?._id]);

	// Socket connection
	useEffect(() => {
		if (!isAuthenticated || !user) return;

		const token = localStorage.getItem('authToken');
		const s = io(SOCKET_URL, { withCredentials: true, auth: token ? { token } : undefined });
		setSocket(s);

		s.on('chat:message', (msg: IChatMessage) => {
			// Student receives staff message → increment badge
			if (!isStaff && msg.senderRole !== 'Student') setTotalUnread((c) => c + 1);
			// Staff receives student message → increment badge
			if (isStaff && msg.senderRole === 'Student') setTotalUnread((c) => c + 1);
		});

		return () => {
			s.disconnect();
			setSocket(null);
		};
	}, [isAuthenticated, user?._id]);

	const clearUnread = () => setTotalUnread(0);

	return (
		<ChatContext.Provider value={{ socket, totalUnread, clearUnread }}>
			{children}
		</ChatContext.Provider>
	);
};

export const useChat = () => useContext(ChatContext);
