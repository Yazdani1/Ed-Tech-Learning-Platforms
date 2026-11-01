'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { useState } from 'react';

import { useCommunityOverview } from '@/api/community.api';
import { useModal } from '@/hooks/useModal';

import { CommunityAdminModal } from '../admin/CommunityAdminModal';
import { useCommunityPermissions } from '../common/useCommunityPermissions';
import { HubSidebar } from '../sidebar/HubSidebar';

import { ChannelList } from './ChannelList';
import { HubControls } from './HubControls';
import { HubDiscussions } from './HubDiscussions';
import { HubHeader } from './HubHeader';
import { HubStats } from './HubStats';
import { useHubFilters } from './useHubFilters';

const columnsSx = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', lg: '290px minmax(0, 1fr) 330px' },
  gap: 2.5,
  alignItems: 'start',
} as const;

/** /community-hub: hero + search, stats, channels, discussions (infinite list), widgets; admin tools. */
export const CommunityHubPage = () => {
  const { isAdmin } = useCommunityPermissions();
  const filterState = useHubFilters(isAdmin);
  const { filters, set } = filterState;
  const query = useCommunityOverview(filters);
  const [formOpen, setFormOpen] = useState(false);
  const adminModal = useModal();
  const first = query.data?.pages[0];

  return (
    <Box sx={{ bgcolor: 'grey.50', flex: 1, pb: 4 }}>
      <HubHeader
        settings={first?.settings ?? null}
        search={filters.search}
        onSearch={(search) => {
          set({ search });
        }}
      />
      <Container maxWidth={false} sx={{ maxWidth: 1440, px: { xs: 2, md: 3 }, mt: 4 }}>
        <Stack spacing={2.5}>
          {first && <HubStats overview={first} />}
          <HubControls
            overview={first}
            filterState={filterState}
            canViewArchive={isAdmin}
            onNewDiscussion={() => {
              setFormOpen((open) => !open);
            }}
            onOpenSettings={() => {
              adminModal.openModal();
            }}
          />
          <Box sx={columnsSx}>
            <ChannelList
              channels={first?.channels ?? []}
              postCounts={first?.channelPostCounts ?? {}}
              totalCount={first?.totalPostCount ?? 0}
              selected={filters.channel}
              onSelect={(channel) => {
                set({ channel });
              }}
            />
            <HubDiscussions
              query={query}
              first={first}
              formOpen={formOpen}
              onCloseForm={() => {
                setFormOpen(false);
              }}
            />
            {first && <HubSidebar widgets={first.widgets} badges={first.badges} />}
          </Box>
        </Stack>
      </Container>
      {isAdmin && adminModal.open && <CommunityAdminModal onClose={adminModal.closeModal} />}
    </Box>
  );
};
