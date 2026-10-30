'use client';

import SchoolIcon from '@mui/icons-material/School';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ListPagination } from '@/components/common/ListPagination';
import { BROWSE_PAGE_SIZE, type BrowseParams } from '@/hooks/useBrowseParams';
import { useBrowseEnrolledIds } from '@/hooks/useBrowseEnrolledIds';

import { CourseGrid, type GridSize } from '../card/CourseGrid';
import { CourseGridSkeleton } from '../card/CourseGridSkeleton';

import type { BrowseResult } from '@/schemas/browse.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

interface CourseResultsProps {
  query: UseQueryResult<BrowseResult, ApiError>;
  filters: BrowseParams;
}

const GRID_SIZE: GridSize = { xs: 12, sm: 6, lg: 4, xl: 3 };

/** The catalog's cards: skeletons, error with retry, empty state (with "Clear filters"), or a page of courses. */
export const CourseResults: FC<CourseResultsProps> = ({ query, filters }) => {
  const { t } = useTranslation();
  const enrolledIds = useBrowseEnrolledIds();
  const hasFilter = filters.search !== '' || filters.activeFilterCount > 0;

  if (query.isPending) return <CourseGridSkeleton count={BROWSE_PAGE_SIZE} size={GRID_SIZE} />;

  if (query.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => void query.refetch()}
            sx={{ minHeight: 44 }}
          >
            {t('common.retry')}
          </Button>
        }
      >
        {query.error.message}
      </Alert>
    );
  }

  const { data: courses, total, pagination } = query.data;
  if (courses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} aria-hidden />
        <Typography variant="h6" component="p" color="text.secondary">
          {hasFilter ? t('browse.catalog.emptyFiltered') : t('browse.catalog.empty')}
        </Typography>
        {hasFilter && (
          <Button onClick={filters.clearAll} sx={{ mt: 2, minHeight: 44 }}>
            {t('browse.catalog.clearFilters')}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ opacity: query.isPlaceholderData ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <CourseGrid courses={courses} enrolledIds={enrolledIds} size={GRID_SIZE} />
      <ListPagination
        page={pagination?.page ?? filters.page}
        limit={pagination?.limit ?? BROWSE_PAGE_SIZE}
        total={total}
        onPageChange={(page) => {
          filters.setPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </Box>
  );
};
