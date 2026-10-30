'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HOME_COURSES_PAGE_SIZE, useHomeCourses } from '@/api/public.api';
import { ListPagination } from '@/components/common/ListPagination';
import { QueryState } from '@/components/common/QueryState';

import { CourseGrid } from '../common/CourseGrid';

import { SectionHeading } from './SectionHeading';

const SECTION_ID = 'courses-section';

/** "Popular Courses": the newest public courses, eight per page. Filters live on /courses. */
export const HomeCourses = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isPending, isPlaceholderData, error, refetch } = useHomeCourses(page);
  const courses = data?.data ?? [];
  const pagination = data?.pagination;

  const changePage = (next: number): void => {
    setPage(next);
    document.getElementById(SECTION_ID)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Box component="section" id={SECTION_ID}>
      <Container maxWidth="xl" sx={{ pt: 6, pb: { xs: 6, md: 10 } }}>
        <SectionHeading
          title={t('public.courses.title')}
          subtitle={t('public.courses.subtitle')}
          action={
            <Button
              component={Link}
              href="/courses"
              endIcon={<ArrowForwardIcon />}
              sx={{ fontWeight: 700, minHeight: 44 }}
            >
              {t('public.courses.viewAll')}
            </Button>
          }
        />
        {/* Loading skeletons come from CourseGrid (card-shaped), so QueryState only handles error/empty */}
        <QueryState
          isLoading={false}
          error={error}
          onRetry={() => void refetch()}
          isEmpty={!isPending && courses.length === 0}
          emptyText={t('public.courses.empty')}
        >
          <Box sx={{ opacity: isPlaceholderData ? 0.6 : 1 }}>
            <CourseGrid
              courses={courses}
              isLoading={isPending}
              skeletons={HOME_COURSES_PAGE_SIZE}
            />
          </Box>
          {pagination && (
            <ListPagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={changePage}
            />
          )}
        </QueryState>
      </Container>
    </Box>
  );
};
