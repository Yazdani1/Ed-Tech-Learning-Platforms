'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HOME_COURSES_PAGE_SIZE, useHomeCourses } from '@/api/public.api';
import { ListPagination } from '@/components/common/ListPagination';
import { QueryState } from '@/components/common/QueryState';

import { CourseGrid } from '../common/CourseGrid';

import { HomeCategoryFilter } from './HomeCategoryFilter';
import { HomeSectionTitle } from './HomeSectionTitle';

import type { HomeSection } from '@/schemas/public.schema';
import type { FC } from 'react';

interface HomeCourseSectionProps {
  /** live: courses of a live course type; free: free courses */
  section: HomeSection;
  /** i18n key group under public.home (title, subtitle, empty) */
  textKey: 'paid' | 'free';
}

const NO_COUNTS: Record<string, number> = {};
/** One row of card-shaped skeletons while the first page loads */
const SKELETON_CARDS = 4;

/** One home page box: centred title, the category cards, then its course cards (30 per page). */
export const HomeCourseSection: FC<HomeCourseSectionProps> = ({ section, textKey }) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const { data, isPending, isPlaceholderData, error, refetch } = useHomeCourses({
    section,
    category,
    page,
  });
  const courses = data?.data ?? [];
  const pagination = data?.pagination;
  const sectionId = `home-${textKey}-courses`;
  const title = t(`public.home.${textKey}.title`);
  const counts =
    section === 'live'
      ? data?.filterCounts?.liveCategories
      : data?.filterCounts?.categoriesByPricing.Free;

  const changePage = (next: number): void => {
    setPage(next);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Container component="section" id={sectionId} maxWidth="lg" sx={{ pt: { xs: 4, md: 6 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <HomeSectionTitle title={title} subtitle={t(`public.home.${textKey}.subtitle`)} />
        <HomeCategoryFilter
          section={title}
          counts={counts ?? NO_COUNTS}
          selected={category}
          onSelect={(next) => {
            setCategory(next);
            setPage(1);
          }}
        />
        {/* Loading skeletons come from CourseGrid (card-shaped), so QueryState only handles error/empty */}
        <QueryState
          isLoading={false}
          error={error}
          onRetry={() => void refetch()}
          isEmpty={!isPending && courses.length === 0}
          emptyText={t(`public.home.${textKey}.empty`)}
        >
          <Box sx={{ opacity: isPlaceholderData ? 0.6 : 1 }}>
            <CourseGrid courses={courses} isLoading={isPending} skeletons={SKELETON_CARDS} />
          </Box>
          {/* Paging only when there are more courses than one page holds */}
          {pagination && pagination.total > HOME_COURSES_PAGE_SIZE && (
            <ListPagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={changePage}
            />
          )}
        </QueryState>
      </Paper>
    </Container>
  );
};
