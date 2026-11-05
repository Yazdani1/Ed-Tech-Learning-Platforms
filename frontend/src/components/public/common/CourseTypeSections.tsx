'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useCourseTypes } from '@/api/catalog.api';
import { useCatalogCounts } from '@/api/public.api';
import { QueryState } from '@/components/common/QueryState';

import { CourseShowcaseSection } from './CourseShowcaseSection';

import type { FC } from 'react';

interface CourseTypeSectionsProps {
  /** Start of each box's element id ("home" or "catalog"); page changes scroll back to the box */
  idPrefix: string;
}

const FREE = { kind: 'free' } as const;

/**
 * Home page and catalog: one box per course type that has paid courses (in the Course Setup order) with the
 * type's own name and description, then one box with every free course. Each box has its own category cards
 * and paging.
 */
export const CourseTypeSections: FC<CourseTypeSectionsProps> = ({ idPrefix }) => {
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
      <Box>
        {typesWithCourses.map((type) => (
          <CourseShowcaseSection
            key={type._id}
            source={{ kind: 'courseType', courseTypeId: type._id }}
            sectionId={`${idPrefix}-type-${type._id}`}
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
          sectionId={`${idPrefix}-free-courses`}
          title={t('browse.catalog.freeTitle')}
          subtitle={t('browse.catalog.freeSubtitle')}
          emptyText={t('browse.catalog.freeEmpty')}
        />
      </Box>
    </QueryState>
  );
};
