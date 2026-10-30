'use client';

import TuneIcon from '@mui/icons-material/Tune';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface CatalogHeaderProps {
  isLoading: boolean;
  total: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

/** "All Courses", the number found, active filters, and the Filters button on phones and tablets. */
export const CatalogHeader: FC<CatalogHeaderProps> = ({
  isLoading,
  total,
  activeFilterCount,
  onOpenFilters,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
          {t('browse.catalog.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} aria-live="polite">
          {isLoading ? t('browse.catalog.loading') : t('browse.catalog.found', { count: total })}
          {activeFilterCount > 0 && (
            <Chip
              component="span"
              label={t('browse.catalog.activeFilters', { count: activeFilterCount })}
              size="small"
              color="primary"
              sx={{ ml: 1, fontWeight: 700 }}
            />
          )}
        </Typography>
      </Box>
      <Badge
        badgeContent={activeFilterCount}
        color="primary"
        sx={{ display: { md: 'none' }, flexShrink: 0 }}
      >
        <Button
          variant="outlined"
          startIcon={<TuneIcon />}
          onClick={onOpenFilters}
          sx={{ minHeight: 44 }}
        >
          {t('browse.catalog.openFilters')}
        </Button>
      </Badge>
    </Box>
  );
};
