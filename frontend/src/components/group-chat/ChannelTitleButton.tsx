'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { nameInitial } from '@/utils/user-display';

import { memberCount } from './group-chat-utils';

import type { DetailsTab } from './ChannelDetailsModal';
import type { ChannelOrCard } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelTitleButtonProps {
  channel: ChannelOrCard;
  /** Opens the details dialog; undefined (not clickable) for a public card */
  onOpen?: (tab: DetailsTab) => void;
}

const buttonSx = {
  display: 'flex',
  gap: 1.5,
  minWidth: 0,
  flex: 1,
  justifyContent: 'flex-start',
  textAlign: 'left',
  borderRadius: 1,
  minHeight: 44,
} as const;

/** Channel initial, name and member count in the header; tapping it opens the channel details. */
export const ChannelTitleButton: FC<ChannelTitleButtonProps> = ({ channel, onOpen }) => {
  const { t } = useTranslation();
  return (
    <ButtonBase
      onClick={() => {
        onOpen?.('description');
      }}
      disabled={!onOpen}
      sx={buttonSx}
    >
      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>{nameInitial(channel.name)}</Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" sx={{ fontWeight: 900 }} noWrap>
          {channel.name}
        </Typography>
        <Typography sx={{ fontSize: 12, opacity: 0.86 }}>
          {t('groupChat.memberCount', { count: memberCount(channel) })}
        </Typography>
      </Box>
    </ButtonBase>
  );
};
