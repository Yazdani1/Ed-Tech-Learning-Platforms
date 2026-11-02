'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface CatalogHeaderProps {
  /** A search or filter is in the URL: show the result count and "Show all courses" */
  isFiltered: boolean;
  isLoading: boolean;
  total: number;
  search: string;
  onShowAll: () => void;
}

/** "All Courses" with a short intro; with a search or filter, the number found and "Show all courses". */
export const CatalogHeader: FC<CatalogHeaderProps> = ({
  isFiltered,
  isLoading,
  total,
  search,
  onShowAll,
}) => {
  const { t } = useTranslation();
  const summary = (): string => {
    if (isLoading) return t('browse.catalog.loading');
    return search
      ? t('browse.catalog.foundFor', { count: total, search })
      : t('browse.catalog.found', { count: total });
  };
  return (
    <Box
      sx={{
        mb: isFiltered ? 3 : 0,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: isFiltered ? 'space-between' : 'center',
        textAlign: isFiltered ? 'left' : 'center',
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
          {t('browse.catalog.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} aria-live="polite">
          {isFiltered ? summary() : t('browse.catalog.subtitle')}
        </Typography>
      </Box>
      {isFiltered && (
        <Button variant="outlined" onClick={onShowAll} sx={{ minHeight: 44 }}>
          {t('browse.catalog.showAll')}
        </Button>
      )}
    </Box>
  );
};
