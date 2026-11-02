'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useCourseTypes } from '@/api/catalog.api';
import { useCatalogCounts } from '@/api/public.api';
import { QueryState } from '@/components/common/QueryState';
import { CourseShowcaseSection } from '@/components/public/common/CourseShowcaseSection';

const FREE = { kind: 'free' } as const;

/**
 * The catalog without filters: one box per course type that has paid courses (in the Course Setup order),
 * then one box with the free courses. Each box has its own category cards and paging (as on the home page).
 */
export const CatalogSections = () => {
  const { t } = useTranslation();
  const types = useCourseTypes();
  const counts = useCatalogCounts();
  const paidByType = counts.data?.filterCounts?.paidByCourseType ?? {};
  const typesWithCourses = (types.data ?? []).filter(
    (type) => (paidByType[type._id]?.total ?? 0) > 0,
  );

  return (
    <QueryState
      isLoading={types.isPending || counts.isPending}
      error={types.error ?? counts.error}
      onRetry={() => {
        void types.refetch();
        void counts.refetch();
      }}
      skeletonRows={6}
    >
      <Box sx={{ pb: { xs: 6, md: 10 } }}>
        {typesWithCourses.map((type) => (
          <CourseShowcaseSection
            key={type._id}
            source={{ kind: 'courseType', courseTypeId: type._id }}
            sectionId={`catalog-type-${type._id}`}
            title={type.name}
            subtitle={
              type.description?.trim()
                ? type.description
                : t('browse.catalog.typeSubtitle', { count: paidByType[type._id]?.total ?? 0 })
            }
            emptyText={t('browse.catalog.typeEmpty')}
          />
        ))}
        <CourseShowcaseSection
          source={FREE}
          sectionId="catalog-free-courses"
          title={t('browse.catalog.freeTitle')}
          subtitle={t('browse.catalog.freeSubtitle')}
          emptyText={t('browse.catalog.freeEmpty')}
        />
      </Box>
    </QueryState>
  );
};
