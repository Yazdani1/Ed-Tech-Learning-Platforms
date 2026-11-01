'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatTime } from '@/utils/dateTime';

import { groupRoleColor } from './group-chat-utils';

import type { GroupMessage } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface MessageMetaProps {
  message: GroupMessage;
  mine: boolean;
}

/** The line above a message: "You" or the sender's name with a role badge, then the time. */
export const MessageMeta: FC<MessageMetaProps> = ({ message, mine }) => {
  const { t, i18n } = useTranslation();
  const badgeSx = {
    px: 0.75,
    borderRadius: 1,
    bgcolor: groupRoleColor(message.senderRole),
    color: '#fff',
    fontSize: 9,
    fontWeight: 600,
  };
  return (
    <Typography
      variant="caption"
      component="p"
      sx={{ mb: 0.4, textAlign: mine ? 'right' : 'left', color: 'text.secondary', fontSize: 11 }}
    >
      {mine ? (
        t('groupChat.messages.you')
      ) : (
        <>
          {message.senderName}{' '}
          <Box component="span" sx={badgeSx}>
            {t(`roles.${message.senderRole}`, { defaultValue: message.senderRole })}
          </Box>
        </>
      )}
      {' · '}
      <time dateTime={message.createdAt}>{formatTime(message.createdAt, i18n.language)}</time>
    </Typography>
  );
};
