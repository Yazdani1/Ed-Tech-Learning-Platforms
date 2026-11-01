'use client';

import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { memberCount } from './group-chat-utils';
import { JoinButtons } from './JoinButtons';

import type { ChannelOrCard } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelJoinPreviewProps {
  channel: ChannelOrCard;
  hasPendingRequest: boolean;
  busy: boolean;
  onJoin: () => void;
  onCancelRequest: () => void;
}

const wrapperSx = {
  flex: 1,
  display: 'grid',
  placeItems: 'center',
  p: { xs: 2, sm: 3 },
  overflowY: 'auto',
} as const;
const cardSx = {
  maxWidth: 520,
  width: '100%',
  p: { xs: 2.5, sm: 4 },
  textAlign: 'center',
  borderRadius: 2,
} as const;
const textSx = { overflowWrap: 'anywhere' } as const;

/** What a non-member sees of a channel: its public card with Join / Request to join / Cancel request. */
export const ChannelJoinPreview: FC<ChannelJoinPreviewProps> = ({
  channel,
  hasPendingRequest,
  busy,
  onJoin,
  onCancelRequest,
}) => {
  const { t } = useTranslation();
  const isPrivate = channel.type === 'Private';

  return (
    <Box sx={wrapperSx}>
      <Paper variant="outlined" sx={cardSx}>
        <Avatar
          sx={{
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2,
            bgcolor: isPrivate ? 'warning.main' : 'success.main',
          }}
        >
          {isPrivate ? <LockIcon fontSize="large" /> : <PublicIcon fontSize="large" />}
        </Avatar>
        <Typography variant="h5" component="h3" sx={{ ...textSx, fontWeight: 900, mb: 1 }}>
          {channel.name}
        </Typography>
        <Typography color="text.secondary" sx={{ ...textSx, mb: 2, whiteSpace: 'pre-wrap' }}>
          {channel.description.trim() || t('groupChat.join.fallbackDescription')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mb: 3 }}>
          <Chip
            label={t(`groupChat.type.${channel.type}`)}
            color={isPrivate ? 'warning' : 'success'}
          />
          <Chip
            label={t('groupChat.memberCount', { count: memberCount(channel) })}
            variant="outlined"
          />
        </Stack>
        <JoinButtons
          type={channel.type}
          hasPendingRequest={hasPendingRequest}
          busy={busy}
          onJoin={onJoin}
          onCancelRequest={onCancelRequest}
        />
      </Paper>
    </Box>
  );
};
