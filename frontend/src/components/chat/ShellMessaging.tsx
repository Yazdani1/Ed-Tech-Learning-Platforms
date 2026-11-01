'use client';

import { usePathname } from 'next/navigation';

import { useNotificationLiveSync } from '@/components/notifications/useNotificationLiveSync';
import { useAuth } from '@/hooks/useAuth';

import { ChatWidget } from './ChatWidget';
import { useChatLiveSync } from './useChatLiveSync';

/** Pages where the floating button would cover the page's own composer (as in the old StudentLayout). */
const HIDE_WIDGET_ON = ['/student/chat', '/student/group-chat'];

/**
 * Mounted once per signed-in shell (by AppShell) and by the student course player: keeps support chat and
 * notifications live, and shows students the floating chat button on their pages (not on the support chat
 * and group chat pages), as the old layout did.
 */
export const ShellMessaging = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  useChatLiveSync();
  useNotificationLiveSync();
  const showWidget =
    user?.role === 'Student' &&
    pathname.startsWith('/student') &&
    !HIDE_WIDGET_ON.some((page) => pathname.startsWith(page));
  return showWidget ? <ChatWidget /> : null;
};
