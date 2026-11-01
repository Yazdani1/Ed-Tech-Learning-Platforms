import { formatDate, formatTime } from '@/utils/dateTime';
import { roleColor } from '@/utils/user-display';

import type { ChatConversation, ChatMessage } from '@/schemas/chat.schema';

/** Header and "sent" bubble colour of the support chat (same as the old client). */
export const CHAT_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
export const CHAT_ACCENT = '#6366f1';
export const CHAT_SURFACE = '#f8f7ff';
export const CHAT_BORDER = 'rgba(99,102,241,0.12)';
export const ONLINE_COLOR = '#22c55e';
export const OFFLINE_COLOR = '#cbd5e1';

/** Gap between the floating chat button (MUI Fab, 56 px) and the screen edges. */
export const CHAT_WIDGET_EDGE_GAP = 24;
const CHAT_FAB_SIZE = 56;
/** Space to leave free at the bottom of a page so its last controls can scroll clear of the chat button. */
export const CHAT_WIDGET_CLEARANCE = CHAT_FAB_SIZE + CHAT_WIDGET_EDGE_GAP * 2;

/** Role colour in the support chat (unknown roles get the chat accent). */
export const chatRoleColor = (role: string): string => roleColor(role, CHAT_ACCENT);

/** Messages whose text, sender name or role contain the search (case-insensitive). */
export const filterMessages = (messages: ChatMessage[], search: string): ChatMessage[] => {
  const query = search.trim().toLowerCase();
  if (!query) return messages;
  return messages.filter((message) =>
    [message.content, message.senderName, message.senderRole]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
};

/** Conversations whose student name, email or last message contain the search. */
export const filterConversations = (
  conversations: ChatConversation[],
  search: string,
): ChatConversation[] => {
  const query = search.trim().toLowerCase();
  if (!query) return conversations;
  return conversations.filter((conversation) =>
    [conversation.student?.name, conversation.student?.email, conversation.lastMessage]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
};

/** Time for today's activity, the date for older activity (conversation list). */
export const formatActivity = (value: string | null | undefined, locale?: string): string => {
  if (!value) return '';
  return formatDate(value) === formatDate(new Date())
    ? formatTime(value, locale)
    : formatDate(value, locale);
};

/** Fixed height for the chat screens inside the shell (the page itself never scrolls; the panes do). */
export const CHAT_SCREEN_HEIGHT = {
  xs: 'calc(100dvh - 56px - 32px)',
  sm: 'calc(100dvh - 64px - 48px)',
  md: 'calc(100dvh - 48px)',
} as const;
export const CHAT_SCREEN_MIN_HEIGHT = 420;
