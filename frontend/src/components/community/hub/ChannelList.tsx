'use client';

import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { safeImage } from '../common/community-utils';

import { ChannelListItem } from './ChannelListItem';

import type { CommunityChannel } from '@/schemas/community.schema';
import type { FC } from 'react';

interface ChannelListProps {
  channels: CommunityChannel[];
  postCounts: Record<string, number>;
  totalCount: number;
  selected: string;
  onSelect: (channelId: string) => void;
}

/** Left column of the hub: "All Channels" and every active channel with its discussion count. */
export const ChannelList: FC<ChannelListProps> = ({
  channels,
  postCounts,
  totalCount,
  selected,
  onSelect,
}) => {
  const { t, i18n } = useTranslation();
  const format = new Intl.NumberFormat(i18n.language);
  const rows = [
    { id: '', name: t('community.allChannels'), count: totalCount, imageUrl: undefined },
    ...channels.map((channel) => ({
      id: channel._id,
      name: channel.name,
      count: postCounts[channel._id] ?? 0,
      imageUrl: safeImage(channel.imageUrl),
    })),
  ];

  return (
    <Paper
      component="nav"
      aria-label={t('community.channelsTitle')}
      elevation={0}
      sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}
    >
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 900, p: 2 }}>
        {t('community.channelsTitle')}
      </Typography>
      <Divider />
      <List disablePadding>
        {rows.map((row, index) => (
          <ChannelListItem
            key={row.id || 'all'}
            name={row.name}
            imageUrl={row.imageUrl}
            count={format.format(row.count)}
            selected={selected === row.id}
            divider={index < rows.length - 1}
            highlight={row.id === ''}
            onSelect={() => {
              onSelect(row.id);
            }}
          />
        ))}
      </List>
    </Paper>
  );
};
