import { createContext, useContext, useEffect, useState } from 'react';
import { notificationService } from '../services/notification.service';
import { useAuth } from './useAuth';
import { useChat } from './ChatContext';
import type { INotification } from '../types';

interface NotificationContextType {
	unreadCount: number;
	refreshUnreadCount: () => void;
	incrementUnreadCount: () => void;
	clearUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
	unreadCount: 0,
	refreshUnreadCount: () => {},
	incrementUnreadCount: () => {},
	clearUnreadCount: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
	const { user, isAuthenticated } = useAuth();
	const { socket } = useChat();
	const [unreadCount, setUnreadCount] = useState(0);

	const refreshUnreadCount = () => {
		if (!isAuthenticated || !user) {
			setUnreadCount(0);
			return;
		}
		notificationService
			.getUnreadCount()
			.then((res) => setUnreadCount(res.data?.count ?? 0))
			.catch(() => {});
	};

	const incrementUnreadCount = () => setUnreadCount((count) => count + 1);
	const clearUnreadCount = () => setUnreadCount(0);

	useEffect(() => {
		refreshUnreadCount();
	}, [isAuthenticated, user?._id]);

	useEffect(() => {
		if (!socket) return;

		const onNewNotification = ({ notification }: { notification: INotification }) => {
			if (!notification?.isRead) incrementUnreadCount();
		};

		socket.on('notification:new', onNewNotification);
		return () => {
			socket.off('notification:new', onNewNotification);
		};
	}, [socket]);

	return (
		<NotificationContext.Provider
			value={{ unreadCount, refreshUnreadCount, incrementUnreadCount, clearUnreadCount }}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export const useNotifications = () => useContext(NotificationContext);
