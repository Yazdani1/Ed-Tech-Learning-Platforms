'use client';

import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

import { ChannelListItem } from './ChannelListItem';
import { isFullChannel, myUnread } from './group-chat-utils';

import type { ChannelOrCard } from '@/schemas/group-chat.schema';
import type { FC, ReactNode } from 'react';

interface ChannelSectionProps {
  title: string;
  channels: ChannelOrCard[];
  selectedId: string | null;
  userId: string | undefined;
  /** Discover entries (green avatars, no unread badge) */
  discover?: boolean;
  onSelect: (channelId: string) => void;
  /** Shown when the list is empty */
  emptyText?: ReactNode;
}

const titleSx = {
  px: 2,
  pt: 1.5,
  pb: 0.5,
  display: 'block',
  fontWeight: 900,
  color: 'text.secondary',
} as const;

/** A titled list of channels in the sidebar (My Channels, Discover Channels). */
export const ChannelSection: FC<ChannelSectionProps> = ({
  title,
  channels,
  selectedId,
  userId,
  discover = false,
  onSelect,
  emptyText,
}) => (
  <>
    <Typography variant="caption" component="h2" sx={titleSx}>
      {title}
    </Typography>
    {channels.length === 0 && emptyText && (
      <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
        {emptyText}
      </Typography>
    )}
    <List disablePadding aria-label={title}>
      {channels.map((channel) => (
        <ChannelListItem
          key={channel._id}
          channel={channel}
          selected={selectedId === channel._id}
          unread={!discover && isFullChannel(channel) ? myUnread(channel, userId) : 0}
          discover={discover}
          onSelect={onSelect}
        />
      ))}
    </List>
  </>
);
