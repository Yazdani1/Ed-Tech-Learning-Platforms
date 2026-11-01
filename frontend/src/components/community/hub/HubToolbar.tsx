'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { HubUserActions } from './HubUserActions';

import type { FC } from 'react';

const actionsSx = {
  gap: 1,
  alignItems: { sm: 'center' },
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

interface HubToolbarProps {
  heading: string;
  /** Search results count, shown while a search is active */
  resultCount: number | null;
  filtersOpen: boolean;
  activeFilterCount: number;
  onToggleFilters: () => void;
  onNewDiscussion: () => void;
  onOpenSettings: () => void;
}

/** "Channel (count)" heading, search result count, the filter toggle and the user's actions. */
export const HubToolbar: FC<HubToolbarProps> = ({
  heading,
  resultCount,
  filtersOpen,
  activeFilterCount,
  onToggleFilters,
  onNewDiscussion,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const filterLabel = filtersOpen
    ? t('community.actions.hideFilters')
    : t('community.actions.showFilters');
  const arrowSx = {
    transform: filtersOpen ? 'rotate(180deg)' : 'none',
    transition: 'transform 0.2s ease',
  };

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{ gap: 1.5, justifyContent: 'space-between', alignItems: { md: 'center' } }}
    >
      <Typography variant="h5" component="h2" sx={{ fontWeight: 900 }}>
        {heading}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={actionsSx}>
        {resultCount !== null && (
          <Typography role="status" sx={{ fontWeight: 800 }}>
            {t('community.search.results', { value: resultCount })}
          </Typography>
        )}
        <Button
          variant="outlined"
          startIcon={<TuneIcon />}
          aria-expanded={filtersOpen}
          endIcon={<ExpandMoreIcon sx={arrowSx} />}
          onClick={onToggleFilters}
          sx={{ minHeight: 44 }}
        >
          {activeFilterCount > 0 ? `${filterLabel} (${activeFilterCount})` : filterLabel}
        </Button>
        <HubUserActions onNewDiscussion={onNewDiscussion} onOpenSettings={onOpenSettings} />
      </Stack>
    </Stack>
  );
};
