'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBrowseCourses } from '@/api/browse.api';
import { useBrowseParams } from '@/hooks/useBrowseParams';

import { CatalogHeader } from './CatalogHeader';
import { CourseFilterPanel } from './CourseFilterPanel';
import { CourseResults } from './CourseResults';
import { FilterDrawer } from './FilterDrawer';

/** Sidebar width on desktop (as in the old page). */
const SIDEBAR_WIDTH = 272;
const SIDEBAR_SX = {
  display: { xs: 'none', md: 'block' },
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  position: 'sticky',
  top: 88,
  maxHeight: 'calc(100vh - 120px)',
  overflowY: 'auto',
  borderRadius: 0.5,
} as const;

/** /courses: the public catalog with filters (sidebar on desktop, drawer on phones) and paging in the URL. */
export const CourseBrowseView = () => {
  const { t } = useTranslation();
  const filters = useBrowseParams();
  const query = useBrowseCourses(filters.query);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const total = query.data?.total ?? 0;
  const panel = <CourseFilterPanel filters={filters} counts={query.data?.filterCounts} />;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <CatalogHeader
        isLoading={query.isPending}
        total={total}
        activeFilterCount={filters.activeFilterCount}
        onOpenFilters={() => {
          setDrawerOpen(true);
        }}
      />
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Paper
          component="aside"
          variant="outlined"
          aria-label={t('browse.filters.title')}
          sx={SIDEBAR_SX}
        >
          {panel}
        </Paper>
        <Box sx={{ flex: 1, minWidth: 0, pb: 6 }}>
          <CourseResults query={query} filters={filters} />
        </Box>
      </Box>
      <FilterDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        total={total}
      >
        {panel}
      </FilterDrawer>
    </Container>
  );
};
