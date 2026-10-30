'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface FilterPanelHeaderProps {
  activeFilterCount: number;
  onClearAll: () => void;
}

/** "Filters" with an "N active" chip that clears every filter. */
export const FilterPanelHeader: FC<FilterPanelHeaderProps> = ({
  activeFilterCount,
  onClearAll,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        minHeight: 52,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'grey.50',
      }}
    >
      <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
        {t('browse.filters.title')}
      </Typography>
      {activeFilterCount > 0 && (
        <Chip
          label={t('browse.filters.active', { count: activeFilterCount })}
          size="small"
          color="primary"
          onClick={onClearAll}
          onDelete={onClearAll}
          aria-label={t('browse.filters.clearAll')}
          sx={{ fontWeight: 700 }}
        />
      )}
    </Box>
  );
};
