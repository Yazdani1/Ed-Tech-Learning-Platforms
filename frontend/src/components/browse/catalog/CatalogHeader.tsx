'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface CatalogHeaderProps {
  isLoading: boolean;
  total: number;
  search: string;
  onShowAll: () => void;
}

/** Above the search / filter results: "All Courses", the number found and "Show all courses". */
export const CatalogHeader: FC<CatalogHeaderProps> = ({ isLoading, total, search, onShowAll }) => {
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
        mb: 3,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h1" variant="h4" sx={{ fontWeight: 800 }}>
          {t('browse.catalog.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} aria-live="polite">
          {summary()}
        </Typography>
      </Box>
      <Button variant="outlined" onClick={onShowAll} sx={{ minHeight: 44 }}>
        {t('browse.catalog.showAll')}
      </Button>
    </Box>
  );
};
