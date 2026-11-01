'use client';

import { useState } from 'react';

import { useDiscoverChannels, useGroupChannels } from '@/api/group-chat.api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import { isChannelMember, isFullChannel, isPlatformAdmin } from './group-chat-utils';

import type { User } from '@/schemas/auth.schema';
import type { Channel, ChannelOrCard } from '@/schemas/group-chat.schema';
import type { ApiError } from '@/services/http.service';

export interface GroupChatSelection {
  search: string;
  setSearch: (value: string) => void;
  mine: Channel[];
  joinable: ChannelOrCard[];
  isLoading: boolean;
  error: ApiError | null;
  retry: () => void;
  selected: ChannelOrCard | null;
  /** Member or platform staff: may read and write the selected channel's messages */
  canOpen: boolean;
  select: (channelId: string | null) => void;
}

/**
 * Channel lists (mine + Discover, filtered by the search box) and the selected channel. Desktop opens the
 * first of my channels by default; phones start on the list (nothing selected).
 */
export const useGroupChatSelection = (user: User | null, phone: boolean): GroupChatSelection => {
  const [search, setSearch] = useState('');
  const [pickedId, setPickedId] = useState<string | null>(null);
  const term = useDebouncedValue(search).trim();
  const channels = useGroupChannels(term);
  const discover = useDiscoverChannels(term);

  const mine = channels.data ?? [];
  const mineIds = new Set(mine.map((channel) => channel._id));
  const joinable = (discover.data ?? []).filter((channel) => !mineIds.has(channel._id));
  const selectedId = pickedId ?? (phone ? null : (mine[0]?._id ?? null));
  const selected =
    mine.find((channel) => channel._id === selectedId) ??
    joinable.find((channel) => channel._id === selectedId) ??
    null;
  const canOpen =
    isFullChannel(selected) &&
    (isChannelMember(selected, user?._id) || isPlatformAdmin(user?.role));

  return {
    search,
    setSearch,
    mine,
    joinable,
    isLoading: channels.isPending,
    error: channels.error,
    retry: () => void channels.refetch(),
    selected,
    canOpen,
    select: setPickedId,
  };
};
