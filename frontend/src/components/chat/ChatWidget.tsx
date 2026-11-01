'use client';

import ChatIcon from '@mui/icons-material/Chat';
import Badge from '@mui/material/Badge';
import Fab from '@mui/material/Fab';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CHAT_GRADIENT, CHAT_WIDGET_EDGE_GAP as EDGE_GAP } from './chat.utils';
import { StudentChatHeader } from './StudentChatHeader';
import { StudentChatPanel } from './StudentChatPanel';
import { useChatUnreadCount } from './useChatUnreadCount';
import { useWidgetFocus } from './useWidgetFocus';

const PANEL_WIDTH = 380;
const PANEL_HEIGHT = 560;
const WIDGET_Z_INDEX = 1200;

/** Full screen on phones, a floating panel in the bottom right corner from 600 px. */
const PANEL_SX = {
  position: 'fixed',
  zIndex: WIDGET_Z_INDEX,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  inset: { xs: 0, sm: 'auto' },
  right: { sm: EDGE_GAP },
  bottom: { sm: EDGE_GAP },
  width: { xs: '100%', sm: PANEL_WIDTH },
  height: { xs: '100dvh', sm: `min(${PANEL_HEIGHT}px, calc(100dvh - ${EDGE_GAP * 2}px))` },
  borderRadius: { xs: 0, sm: 2 },
  outline: 'none',
} as const;

/**
 * Students, every page of their area except the chat pages: a floating button that opens the chat. Opening
 * moves the focus into the chat; Escape or the close button closes it and gives the focus back to the button.
 */
export const ChatWidget = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const unread = useChatUnreadCount();
  const close = (): void => {
    setOpen(false);
  };
  const { panelRef, buttonRef, closeOnEscape } = useWidgetFocus(open, close);

  if (open) {
    return (
      <Paper
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        onKeyDown={closeOnEscape}
        aria-label={t('messaging.chat.title')}
        elevation={8}
        sx={PANEL_SX}
      >
        <StudentChatHeader headingComponent="h2" onClose={close} />
        <StudentChatPanel />
      </Paper>
    );
  }

  return (
    <Fab
      ref={buttonRef}
      onClick={() => {
        setOpen(true);
      }}
      aria-label={
        unread > 0
          ? t('messaging.topBar.chatUnread', { count: unread })
          : t('messaging.chat.openWidget')
      }
      sx={{
        position: 'fixed',
        zIndex: WIDGET_Z_INDEX,
        right: EDGE_GAP,
        bottom: EDGE_GAP,
        color: '#fff',
        background: CHAT_GRADIENT,
      }}
    >
      <Badge badgeContent={unread} color="error" invisible={unread === 0}>
        <ChatIcon />
      </Badge>
    </Fab>
  );
};
