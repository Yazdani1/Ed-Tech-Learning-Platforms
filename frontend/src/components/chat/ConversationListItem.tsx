import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CHAT_ACCENT, formatActivity } from './chat.utils';
import { PresenceAvatar } from './PresenceAvatar';

import type { ChatConversation } from '@/schemas/chat.schema';
import type { FC } from 'react';

interface ConversationListItemProps {
  conversation: ChatConversation;
  selected: boolean;
  online: boolean;
  onSelect: () => void;
}

const ONLINE_TEXT = '#16a34a';

/** One student in the support inbox: avatar with presence dot, unread badge, time and last message. */
export const ConversationListItem: FC<ConversationListItemProps> = ({
  conversation,
  selected,
  online,
  onSelect,
}) => {
  const { t, i18n } = useTranslation();
  const name = conversation.student?.name ?? t('messaging.chat.studentFallback');
  const unread = conversation.unreadByStaff;
  const presence = online ? t('messaging.chat.activeNow') : t('messaging.chat.offline');
  return (
    <ListItemButton
      component="li"
      selected={selected}
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      sx={{
        px: 2,
        py: 1.5,
        gap: 1.25,
        minHeight: 64,
        borderLeft: '3px solid',
        borderLeftColor: selected ? CHAT_ACCENT : 'transparent',
      }}
    >
      <Badge badgeContent={unread} color="error" invisible={unread === 0}>
        <PresenceAvatar name={name} avatar={conversation.student?.avatar} online={online} />
      </Badge>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: unread > 0 ? 700 : 500 }} noWrap>
            {name}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
            {formatActivity(conversation.lastMessageAt, i18n.language)}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ display: 'block', color: online ? ONLINE_TEXT : 'text.disabled', fontWeight: 600 }}
        >
          {unread > 0 ? `${presence} · ${t('messaging.chat.unread', { count: unread })}` : presence}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: 'block', color: unread > 0 ? CHAT_ACCENT : 'text.secondary' }}
          noWrap
        >
          {conversation.lastMessage || t('messaging.chat.noMessagesYet')}
        </Typography>
      </Box>
    </ListItemButton>
  );
};
