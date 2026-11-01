'use client';

import { useMyConversation, useStaffConversations } from '@/api/chat.api';
import { useAuth } from '@/hooks/useAuth';

/**
 * Unread support chat messages for the badges: a student's unread staff replies, or for staff the
 * students' unread messages across all conversations. Kept live by useChatLiveSync. `enabled` false: nothing
 * is fetched for this caller (the count may still come from the cache).
 */
export const useChatUnreadCount = (enabled = true): number => {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const signedIn = enabled && user !== null;
  const staff = useStaffConversations(signedIn && !isStudent);
  const mine = useMyConversation(signedIn && isStudent);
  if (isStudent) return mine.data?.unreadByStudent ?? 0;
  return (staff.data ?? []).reduce((sum, conversation) => sum + conversation.unreadByStaff, 0);
};
