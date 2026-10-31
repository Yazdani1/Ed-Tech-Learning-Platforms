'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import type { FC, ReactNode } from 'react';

interface FilterPanelActionsProps {
  activeCount: number;
  onClear: () => void;
  open: boolean;
  onToggle: () => void;
  /** id of the collapsible filter region */
  regionId: string;
  chips?: ReactNode;
}

/** Right side of a filter box: extra chips, "N filters active", Clear, Show/Hide filters. */
export const FilterPanelActions: FC<FilterPanelActionsProps> = ({
  activeCount,
  onClear,
  open,
  onToggle,
  regionId,
  chips,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {chips}
      {activeCount > 0 && (
        <>
          <Chip
            label={t('people.filters.active', { count: activeCount })}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
          <Button size="small" onClick={onClear} sx={{ minHeight: 44 }}>
            {t('people.filters.clear')}
          </Button>
        </>
      )}
      <Button
        variant={open ? 'contained' : 'outlined'}
        startIcon={<TuneIcon />}
        endIcon={
          <ExpandMoreIcon
            sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms' }}
          />
        }
        aria-expanded={open}
        aria-controls={regionId}
        onClick={onToggle}
        sx={{ minHeight: 44 }}
      >
        {open ? t('people.filters.hide') : t('people.filters.show')}
      </Button>
    </Box>
  );
};
