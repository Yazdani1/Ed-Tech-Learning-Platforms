import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UserAvatar } from '@/components/common/UserAvatar';

import { CHAT_ACCENT, chatRoleColor } from './chat.utils';

import type { ChatTyping } from '@/schemas/chat.schema';
import type { FC } from 'react';

interface TypingIndicatorProps {
  typing: ChatTyping;
}

const DOTS = [0, 1, 2];
const DOT_DELAY_S = 0.16;

/** "Name is typing" with three bouncing dots. */
export const TypingIndicator: FC<TypingIndicatorProps> = ({ typing }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }} role="status">
      <UserAvatar name={typing.userName} color={chatRoleColor(typing.userRole)} size={28} />
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
          {t('messaging.chat.typing', { name: typing.userName })}
        </Typography>
        <Box
          aria-hidden
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.45,
            width: 50,
            px: 1.3,
            py: 0.95,
            borderRadius: '14px 14px 14px 4px',
            bgcolor: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            '@keyframes typingDotPulse': {
              '0%, 80%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
              '40%': { opacity: 1, transform: 'translateY(-3px)' },
            },
          }}
        >
          {DOTS.map((index) => (
            <Box
              key={index}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: CHAT_ACCENT,
                animation: 'typingDotPulse 1.1s infinite ease-in-out',
                animationDelay: `${index * DOT_DELAY_S}s`,
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
