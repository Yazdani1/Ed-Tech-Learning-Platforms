'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import type { HubFilterState } from './useHubFilters';
import type { CommunityChannel } from '@/schemas/community.schema';
import type { FC } from 'react';

const panelSx = {
  pt: 2,
  mt: 2,
  borderTop: 1,
  borderColor: 'divider',
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
  gap: 2,
} as const;
const DATE_FIELDS = ['dateFrom', 'dateTo'] as const;
const DATE_LABELS = { dateFrom: 'community.filters.from', dateTo: 'community.filters.to' } as const;

interface HubFiltersProps {
  open: boolean;
  state: HubFilterState;
  channels: CommunityChannel[];
  canViewArchive: boolean;
}

/** Filter panel: channel, from/to dates, archive switch (Super Admin, Admin) and "Clear filters". */
export const HubFilters: FC<HubFiltersProps> = ({ open, state, channels, canViewArchive }) => {
  const { t } = useTranslation();
  const { filters, set, clear, activeCount } = state;

  return (
    <Collapse in={open} unmountOnExit>
      <Box sx={panelSx}>
        <TextField
          select
          size="small"
          label={t('community.filters.channel')}
          value={filters.channel}
          onChange={(event) => {
            set({ channel: event.target.value });
          }}
        >
          <MenuItem value="">{t('community.filters.allChannels')}</MenuItem>
          {channels.map((channel) => (
            <MenuItem key={channel._id} value={channel._id}>
              {channel.name}
            </MenuItem>
          ))}
        </TextField>
        {DATE_FIELDS.map((field) => (
          <TextField
            key={field}
            size="small"
            type="date"
            label={t(DATE_LABELS[field])}
            value={filters[field]}
            onChange={(event) => {
              set({ [field]: event.target.value });
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        ))}
        {canViewArchive && (
          <Button
            variant={filters.archived ? 'contained' : 'outlined'}
            aria-pressed={filters.archived}
            onClick={() => {
              set({ archived: !filters.archived });
            }}
            sx={{ minHeight: 44 }}
          >
            {filters.archived
              ? t('community.filters.archiveOn')
              : t('community.filters.archiveOff')}
          </Button>
        )}
        {activeCount > 0 && (
          <Button onClick={clear} sx={{ minHeight: 44 }}>
            {t('community.filters.clear')}
          </Button>
        )}
      </Box>
    </Collapse>
  );
};
