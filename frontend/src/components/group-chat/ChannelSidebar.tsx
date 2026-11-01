'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { ChannelSection } from './ChannelSection';
import { ChannelSidebarHeader } from './ChannelSidebarHeader';

import type { GroupChatSelection } from './useGroupChatSelection';
import type { FC } from 'react';

interface ChannelSidebarProps {
  /** Lists, search box and selection (useGroupChatSelection) */
  view: GroupChatSelection;
  userId: string | undefined;
  onCreate: () => void;
}

const columnSx = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  bgcolor: 'background.paper',
} as const;

/** Left column: channel search, Create Channel, My Channels and Discover Channels. */
export const ChannelSidebar: FC<ChannelSidebarProps> = ({ view, userId, onCreate }) => {
  const { t } = useTranslation();
  const { isLoading, error, joinable } = view;
  const selectedId = view.selected?._id ?? null;
  const busy = isLoading || error !== null;

  return (
    <Box sx={columnSx}>
      <ChannelSidebarHeader search={view.search} onSearchChange={view.setSearch} />
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreate}
          sx={{ minHeight: 44 }}
        >
          {t('groupChat.createChannel')}
        </Button>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', p: busy ? 1.5 : 0 }}>
        <QueryState isLoading={isLoading} error={error} onRetry={view.retry}>
          <ChannelSection
            title={t('groupChat.myChannels')}
            channels={view.mine}
            selectedId={selectedId}
            userId={userId}
            onSelect={view.select}
            emptyText={t('groupChat.noChannels')}
          />
          {joinable.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <ChannelSection
                title={t('groupChat.discoverChannels')}
                channels={joinable}
                selectedId={selectedId}
                userId={userId}
                discover
                onSelect={view.select}
              />
            </>
          )}
        </QueryState>
      </Box>
    </Box>
  );
};
