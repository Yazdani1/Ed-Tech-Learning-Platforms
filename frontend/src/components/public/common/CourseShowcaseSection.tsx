'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useState } from 'react';

import { HOME_COURSES_PAGE_SIZE, sectionCategoryCounts, useHomeCourses } from '@/api/public.api';
import { ListPagination } from '@/components/common/ListPagination';
import { QueryState } from '@/components/common/QueryState';

import { HomeCategoryFilter } from '../home/HomeCategoryFilter';
import { HomeSectionTitle } from '../home/HomeSectionTitle';

import { CourseGrid } from './CourseGrid';

import type { CourseSectionSource } from '@/schemas/public.schema';
import type { FC } from 'react';

interface CourseShowcaseSectionProps {
  /** What the section lists (live courses, free courses, or one course type's paid courses) */
  source: CourseSectionSource;
  /** Element id (page changes scroll back to it) */
  sectionId: string;
  title: string;
  subtitle: string;
  emptyText: string;
}

const NO_COUNTS: Record<string, number> = {};
/** One row of card-shaped skeletons while the first page loads */
const SKELETON_CARDS = 3;

/**
 * One course box (home page and catalog): centred title, the category cards, then its course cards
 * (30 per page).
 */
export const CourseShowcaseSection: FC<CourseShowcaseSectionProps> = ({
  source,
  sectionId,
  title,
  subtitle,
  emptyText,
}) => {
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const { data, isPending, isPlaceholderData, error, refetch } = useHomeCourses({
    source,
    category,
    page,
  });
  const courses = data?.data ?? [];
  const pagination = data?.pagination;

  const changePage = (next: number): void => {
    setPage(next);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Container component="section" id={sectionId} maxWidth="lg" sx={{ pt: { xs: 4, md: 6 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: 2 }}>
        <HomeSectionTitle title={title} subtitle={subtitle} />
        <HomeCategoryFilter
          section={title}
          counts={sectionCategoryCounts(source, data?.filterCounts) ?? NO_COUNTS}
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
          emptyText={emptyText}
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
