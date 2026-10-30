'use client';

import CardMembership from '@mui/icons-material/CardMembership';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useMyEnrollments } from '@/api/catalog.api';
import { PageHeader } from '@/components/common/PageHeader';
import { SUBSCRIPTION_COLOR } from '@/components/course-card/course-card';
import { CourseSearchField } from '@/components/course-card/CourseSearchField';
import { QueryState } from '@/components/common/QueryState';

import { CourseCardSkeletons } from './CourseCardSkeletons';
import { EnrolledCourseSection } from './EnrolledCourseSection';
import { filterByTitle } from './enrolledCourse.utils';
import { useMyCoursesSearch } from './useMyCoursesSearch';
import { useRemoveEnrollment } from './useRemoveEnrollment';

/** /student/courses: the student's enrolments in two groups (free & paid, subscription). */
export const MyCoursesPage = () => {
  const { t } = useTranslation();
  const { urlSearch, search, setSearch, saveSearch } = useMyCoursesSearch();
  const query = useMyEnrollments();
  const { onRemove, removingId } = useRemoveEnrollment();

  const courses = query.data ?? [];
  const filtered = filterByTitle(courses, search);
  const term = search.trim();

  return (
    <Box>
      <PageHeader title={t('nav.myCourses')} />
      <CourseSearchField
        value={urlSearch}
        onSearch={saveSearch}
        onTextChange={setSearch}
        placeholder={t('student.searchPlaceholder')}
        label={t('student.searchPlaceholder')}
        sx={{ mb: 3, maxWidth: { sm: 360 } }}
      />
      {query.isPending ? (
        <CourseCardSkeletons />
      ) : (
        <QueryState
          isLoading={false}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={courses.length === 0}
          emptyText={t('student.noEnrollments')}
        >
          <EnrolledCourseSection
            title={t('student.directSection')}
            courses={filtered.filter((course) => course.enrollmentType !== 'subscription')}
            emptyText={t('student.directEmpty')}
            onRemove={onRemove}
            removingId={removingId}
          />
          <EnrolledCourseSection
            title={t('student.subscriptionSection')}
            icon={<CardMembership sx={{ color: SUBSCRIPTION_COLOR }} aria-hidden />}
            countColor={SUBSCRIPTION_COLOR}
            courses={filtered.filter((course) => course.enrollmentType === 'subscription')}
            emptyText={t('student.subscriptionEmpty')}
            onRemove={onRemove}
            removingId={removingId}
          />
          {filtered.length === 0 && term !== '' && (
            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('student.noMatch', { search: term })}
            </Typography>
          )}
        </QueryState>
      )}
    </Box>
  );
};
