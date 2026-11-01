import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatTime } from '@/utils/dateTime';
import { UserAvatar } from '@/components/common/UserAvatar';

import { CHAT_GRADIENT, chatRoleColor } from './chat.utils';

import type { ChatMessage } from '@/schemas/chat.schema';
import type { FC } from 'react';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

const AVATAR_SIZE = 32;

const bubbleSx = (isMine: boolean) =>
  ({
    px: 1.75,
    py: 1,
    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: isMine ? CHAT_GRADIENT : '#fff',
    color: isMine ? '#fff' : 'text.primary',
    boxShadow: isMine ? '0 2px 10px rgba(99,102,241,0.4)' : '0 1px 4px rgba(0,0,0,0.08)',
  }) as const;

const roleChipSx = (role: string) =>
  ({
    px: 0.75,
    borderRadius: 1,
    bgcolor: chatRoleColor(role),
    color: '#fff',
    fontSize: 10,
    fontWeight: 600,
  }) as const;

/** One message: avatar, "name [role] · time" and the text (mine on the right in the accent colour). */
export const MessageBubble: FC<MessageBubbleProps> = ({ message, isMine }) => {
  const { t, i18n } = useTranslation();
  return (
    <Box
      component="li"
      sx={{
        display: 'flex',
        flexDirection: isMine ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 1,
        mb: 2,
      }}
    >
      <UserAvatar
        name={message.senderName}
        color={chatRoleColor(message.senderRole)}
        avatar={message.senderAvatar}
        size={AVATAR_SIZE}
      />
      <Box sx={{ maxWidth: { xs: '80%', sm: '70%' }, minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 0.4, display: 'block', textAlign: isMine ? 'right' : 'left' }}
        >
          {isMine ? t('messaging.chat.you') : message.senderName}{' '}
          {!isMine && (
            <Box component="span" sx={roleChipSx(message.senderRole)}>
              {message.senderRole}
            </Box>
          )}
          {' · '}
          {formatTime(message.createdAt, i18n.language)}
        </Typography>
        <Box sx={bubbleSx(isMine)}>
          <Typography
            sx={{ fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {message.content}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
