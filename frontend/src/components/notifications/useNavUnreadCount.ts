'use client';

import { useUnreadNotificationCount } from '@/api/notifications.api';
import { useChatUnreadCount } from '@/components/chat/useChatUnreadCount';
import { useAuth } from '@/hooks/useAuth';

export type NavBadgeKind = 'chat' | 'notifications';

/** The unread count behind a sidebar item's badge (0 for items without one). */
export const useNavUnreadCount = (kind: NavBadgeKind | undefined): number => {
  const { isAuthenticated } = useAuth();
  const notifications = useUnreadNotificationCount(isAuthenticated && kind === 'notifications');
  const chat = useChatUnreadCount(kind === 'chat');
  if (kind === 'chat') return chat;
  return kind === 'notifications' ? (notifications.data ?? 0) : 0;
};
