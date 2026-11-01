'use client';

import ChatIcon from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { useUnreadNotificationCount } from '@/api/notifications.api';
import { useChatUnreadCount } from '@/components/chat/useChatUnreadCount';
import { useAuth } from '@/hooks/useAuth';

const AREAS = ['/admin', '/student', '/teacher'] as const;

/** The signed-in area of the current page ("/admin", "/student" or "/teacher"). */
const areaOf = (pathname: string): string =>
  AREAS.find((area) => pathname === area || pathname.startsWith(`${area}/`)) ?? '/student';

const BUTTON_SX = { width: 44, height: 44 } as const;

/** Top bar (phones and tablets): support chat and notifications with their unread badges. */
export const TopBarAlerts = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const area = areaOf(usePathname());
  const notifications = useUnreadNotificationCount(isAuthenticated).data ?? 0;
  const chat = useChatUnreadCount();

  return (
    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
      <IconButton
        component={Link}
        href={`${area}/chat`}
        sx={BUTTON_SX}
        aria-label={
          chat > 0 ? t('messaging.topBar.chatUnread', { count: chat }) : t('messaging.topBar.chat')
        }
      >
        <Badge badgeContent={chat} color="error" invisible={chat === 0}>
          <ChatIcon />
        </Badge>
      </IconButton>
      <IconButton
        component={Link}
        href={`${area}/notifications`}
        sx={BUTTON_SX}
        aria-label={
          notifications > 0
            ? t('messaging.topBar.notificationsUnread', { count: notifications })
            : t('messaging.topBar.notifications')
        }
      >
        <Badge badgeContent={notifications} color="error" invisible={notifications === 0}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Box>
  );
};
