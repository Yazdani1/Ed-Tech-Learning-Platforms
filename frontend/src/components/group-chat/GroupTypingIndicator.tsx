'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';

import { groupRoleColor } from './group-chat-utils';

import type { TypingEvent } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface GroupTypingIndicatorProps {
  typingUser: TypingEvent;
}

const DOTS = [0, 1, 2];
const DOT_DELAY_S = 0.16;

/** "<name> is typing" with three pulsing dots, under the last message. */
export const GroupTypingIndicator: FC<GroupTypingIndicatorProps> = ({ typingUser }) => {
  const { t } = useTranslation();
  return (
    <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <UserAvatar
        name={typingUser.userName}
        size={26}
        color={groupRoleColor(typingUser.userRole)}
      />
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 0.25, fontSize: 10 }}
        >
          {t('groupChat.messages.typing', { name: typingUser.userName })}
        </Typography>
        <Box
          aria-hidden
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.45,
            width: 44,
            px: 1.15,
            py: 0.85,
            borderRadius: '13px 13px 13px 4px',
            bgcolor: 'background.paper',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            '@keyframes groupTypingDot': {
              '0%, 80%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
              '40%': { opacity: 1, transform: 'translateY(-3px)' },
            },
          }}
        >
          {DOTS.map((index) => (
            <Box
              key={index}
              sx={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                bgcolor: '#6366f1',
                animation: 'groupTypingDot 1.1s infinite ease-in-out',
                animationDelay: `${index * DOT_DELAY_S}s`,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
