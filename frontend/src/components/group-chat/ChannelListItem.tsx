'use client';

import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTranslation } from 'react-i18next';

import { memberCount } from './group-chat-utils';

import type { ChannelOrCard } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelListItemProps {
  channel: ChannelOrCard;
  selected: boolean;
  unread?: number;
  /** Discover entries use a green avatar (as before) */
  discover?: boolean;
  onSelect: (channelId: string) => void;
}

/** One channel in the sidebar: type icon, name, member count and my unread messages. */
export const ChannelListItem: FC<ChannelListItemProps> = ({
  channel,
  selected,
  unread = 0,
  discover = false,
  onSelect,
}) => {
  const { t } = useTranslation();
  const isPrivate = channel.type === 'Private';
  const publicColor = discover ? 'success.main' : 'primary.main';

  return (
    <ListItemButton
      selected={selected}
      aria-current={selected ? 'true' : undefined}
      onClick={() => {
        onSelect(channel._id);
      }}
      sx={{
        minHeight: 56,
        borderLeft: '4px solid',
        borderLeftColor: selected ? 'primary.main' : 'transparent',
      }}
    >
      <ListItemAvatar>
        <Badge
          badgeContent={unread}
          color="error"
          invisible={unread === 0}
          slotProps={{ badge: { 'aria-label': t('groupChat.unreadCount', { count: unread }) } }}
        >
          <Avatar sx={{ bgcolor: isPrivate ? 'warning.main' : publicColor }}>
            {isPrivate ? <LockIcon /> : <PublicIcon />}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={channel.name}
        secondary={t('groupChat.memberCount', { count: memberCount(channel) })}
        slotProps={{
          primary: { noWrap: true, sx: { fontWeight: 800 } },
          secondary: {
            noWrap: true,
            variant: 'caption',
            component: 'span',
            sx: { display: 'block' },
          },
        }}
      />
    </ListItemButton>
  );
};
