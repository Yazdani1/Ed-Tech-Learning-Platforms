'use client';

import Avatar from '@mui/material/Avatar';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';

import { initial } from '../common/community-utils';

import type { FC } from 'react';

const itemSx = {
  display: 'grid',
  gridTemplateColumns: '44px minmax(0, 1fr) auto',
  gap: 1.25,
  minHeight: 56,
  borderLeft: 4,
  borderLeftColor: 'transparent',
  '&.Mui-selected': { borderLeftColor: 'primary.main' },
} as const;

interface ChannelListItemProps {
  name: string;
  imageUrl: string | undefined;
  count: string;
  selected: boolean;
  divider: boolean;
  /** "All Channels" uses the brand colour for its letter */
  highlight: boolean;
  onSelect: () => void;
}

/** One row of the channel list: picture (or first letter), name and discussion count. */
export const ChannelListItem: FC<ChannelListItemProps> = ({
  name,
  imageUrl,
  count,
  selected,
  divider,
  highlight,
  onSelect,
}) => (
  <ListItemButton
    selected={selected}
    aria-current={selected ? 'true' : undefined}
    divider={divider}
    onClick={onSelect}
    sx={itemSx}
  >
    <Avatar
      src={imageUrl}
      alt=""
      variant="rounded"
      sx={{ bgcolor: highlight ? 'primary.main' : undefined }}
    >
      {initial(name)}
    </Avatar>
    <Typography sx={{ fontWeight: 800 }} noWrap>
      {name}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
      {count}
    </Typography>
  </ListItemButton>
);
