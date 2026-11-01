'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { UserAvatar } from '@/components/common/UserAvatar';

import { groupRoleColor, isImageType, SENT_GRADIENT } from './group-chat-utils';
import { MessageAttachment } from './MessageAttachment';
import { MessageMeta } from './MessageMeta';

import type { GroupMessage } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

const AVATAR_SIZE = 32;

interface MessageBubbleProps {
  message: GroupMessage;
  mine: boolean;
}

const bubbleSx = (mine: boolean, imageOnly: boolean) => {
  if (imageOnly) return { p: 0, background: 'transparent', boxShadow: 'none' };
  return {
    p: 1.25,
    borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    color: mine ? '#fff' : 'text.primary',
    background: mine ? SENT_GRADIENT : '#fff',
    boxShadow: mine ? '0 2px 10px rgba(37, 99, 235, 0.28)' : '0 1px 4px rgba(0,0,0,0.08)',
  };
};

const textSx = {
  whiteSpace: 'pre-wrap',
  fontSize: 14,
  lineHeight: 1.5,
  overflowWrap: 'anywhere',
} as const;

/** One message: sender avatar, name + role badge (others) or "You", time, text and attachments. */
export const MessageBubble: FC<MessageBubbleProps> = ({ message, mine }) => {
  const imageOnly =
    !message.content &&
    message.attachments.length > 0 &&
    message.attachments.every((file) => isImageType(file.mimeType));

  return (
    <Stack direction={mine ? 'row-reverse' : 'row'} spacing={1} sx={{ alignItems: 'flex-end' }}>
      <UserAvatar
        name={message.senderName}
        avatar={message.senderAvatar}
        size={AVATAR_SIZE}
        color={groupRoleColor(message.senderRole)}
      />
      <Box sx={{ maxWidth: { xs: '82%', sm: '72%' }, minWidth: 0 }}>
        <MessageMeta message={message} mine={mine} />
        <Paper elevation={0} sx={bubbleSx(mine, imageOnly)}>
          {message.content && <Typography sx={textSx}>{message.content}</Typography>}
          {message.attachments.length > 0 && (
            <Stack spacing={0.75} sx={{ mt: message.content ? 1 : 0 }}>
              {message.attachments.map((file) => (
                <MessageAttachment key={file.publicId} file={file} mine={mine} />
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Stack>
  );
};
