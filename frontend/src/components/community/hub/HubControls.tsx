'use client';

import Box from '@mui/material/Box';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HubFilters } from './HubFilters';
import { HubToolbar } from './HubToolbar';

import type { HubFilterState } from './useHubFilters';
import type { CommunityOverview } from '@/schemas/community.schema';
import type { FC } from 'react';

interface HubControlsProps {
  overview: CommunityOverview | undefined;
  filterState: HubFilterState;
  canViewArchive: boolean;
  onNewDiscussion: () => void;
  onOpenSettings: () => void;
}

/** Heading with the discussion count, actions and the filter panel above the hub's columns. */
export const HubControls: FC<HubControlsProps> = ({
  overview,
  filterState,
  canViewArchive,
  onNewDiscussion,
  onOpenSettings,
}) => {
  const { t, i18n } = useTranslation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters } = filterState;
  const channels = overview?.channels ?? [];
  const selected = channels.find((channel) => channel._id === filters.channel);
  const count = filters.channel
    ? (overview?.channelPostCounts[filters.channel] ?? 0)
    : (overview?.totalPostCount ?? 0);
  const heading = t('community.channelHeading', {
    name: selected?.name ?? t('community.allChannels'),
    value: new Intl.NumberFormat(i18n.language).format(count),
  });

  return (
    <Box>
      <HubToolbar
        heading={heading}
        resultCount={filters.search && overview ? overview.resultPostCount : null}
        filtersOpen={filtersOpen}
        activeFilterCount={filterState.activeCount}
        onToggleFilters={() => {
          // Closing the panel clears its filters (as in the old page)
          if (filtersOpen) filterState.clear();
          setFiltersOpen((open) => !open);
        }}
        onNewDiscussion={onNewDiscussion}
        onOpenSettings={onOpenSettings}
      />
      <HubFilters
        open={filtersOpen}
        state={filterState}
        channels={channels}
        canViewArchive={canViewArchive}
      />
    </Box>
  );
};
