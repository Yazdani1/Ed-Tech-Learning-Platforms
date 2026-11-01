import type { NotificationPriority } from '@/schemas/notifications.schema';

type ChipColor = 'info' | 'warning' | 'error' | 'success';

/** Chip colour and left border of each priority (same as the old page). */
export const PRIORITY_STYLES: Record<NotificationPriority, { color: ChipColor; border: string }> = {
  Low: { color: 'success', border: '#22c55e' },
  Normal: { color: 'info', border: '#3b82f6' },
  High: { color: 'warning', border: '#f59e0b' },
  Urgent: { color: 'error', border: '#ef4444' },
};

export const UNREAD_BACKGROUND = 'rgba(99,102,241,0.13)';
export const EXPANDED_BACKGROUND = 'rgba(245,158,11,0.1)';

/** The bordered card around each notifications section. */
export const PANEL_SX = {
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden',
} as const;
