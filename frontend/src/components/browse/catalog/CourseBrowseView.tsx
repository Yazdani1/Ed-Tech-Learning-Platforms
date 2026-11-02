'use client';

import Container from '@mui/material/Container';

import { useBrowseCourses } from '@/api/browse.api';
import { useBrowseParams } from '@/hooks/useBrowseParams';

import { CatalogHeader } from './CatalogHeader';
import { CatalogSections } from './CatalogSections';
import { CourseResults } from './CourseResults';

/**
 * /courses: without a search or filter, one section per course type plus the free courses (like the home
 * page); with one (navbar search, "See all" links, category links), the matching courses with paging.
 */
export const CourseBrowseView = () => {
  const filters = useBrowseParams();
  const hasFilter = filters.search !== '' || filters.activeFilterCount > 0;
  const query = useBrowseCourses(filters.query, hasFilter);

  return (
    <>
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 4 } }}>
        <CatalogHeader
          isFiltered={hasFilter}
          isLoading={query.isPending}
          total={query.data?.total ?? 0}
          search={filters.search}
          onShowAll={filters.clearAll}
        />
      </Container>
      {hasFilter ? (
        <Container maxWidth="lg" sx={{ pb: 6 }}>
          <CourseResults query={query} filters={filters} />
        </Container>
      ) : (
        <CatalogSections />
      )}
    </>
  );
};
