'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useBrowseCourses } from '@/api/browse.api';
import { CourseTypeSections } from '@/components/public/common/CourseTypeSections';
import { useBrowseParams } from '@/hooks/useBrowseParams';
import { VISUALLY_HIDDEN } from '@/theme/visually-hidden';

import { CatalogHeader } from './CatalogHeader';
import { CourseResults } from './CourseResults';

/**
 * /courses: without a search or filter, one section per course type plus the free courses (like the home
 * page); with one (navbar search, "See all" links, category links), the number found and the matching
 * courses with paging.
 */
export const CourseBrowseView = () => {
  const { t } = useTranslation();
  const filters = useBrowseParams();
  const hasFilter = filters.search !== '' || filters.activeFilterCount > 0;
  const query = useBrowseCourses(filters.query, hasFilter);

  if (!hasFilter) {
    return (
      <Box sx={{ pb: { xs: 6, md: 10 } }}>
        <Typography component="h1" sx={VISUALLY_HIDDEN}>
          {t('browse.catalog.title')}
        </Typography>
        <CourseTypeSections idPrefix="catalog" />
      </Box>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 }, pb: 6 }}>
      <CatalogHeader
        isLoading={query.isPending}
        total={query.data?.total ?? 0}
        search={filters.search}
        onShowAll={filters.clearAll}
      />
      <CourseResults query={query} filters={filters} />
    </Container>
  );
};
