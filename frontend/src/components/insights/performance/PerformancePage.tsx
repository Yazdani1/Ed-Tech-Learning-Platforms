'use client';

import Box from '@mui/material/Box';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ALL_COURSES, usePerformanceCourses, usePerformanceOverview } from '@/api/insights.api';
import { QueryState } from '@/components/common/QueryState';

import { CourseSelectDrawer } from './CourseSelectDrawer';
import { PerformanceChartPanel } from './PerformanceChartPanel';
import { PerformanceControls } from './PerformanceControls';
import { PerformanceHeader } from './PerformanceHeader';
import { PerformanceStats } from './PerformanceStats';
import { usePerformanceParams } from './usePerformanceParams';

/** /admin/performance (Super Admin): revenue and enrolments for all courses or one, over 7d/30d/lifetime. */
export const PerformancePage = () => {
  const { t } = useTranslation();
  const { params, setParams } = usePerformanceParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const courses = usePerformanceCourses();
  const overview = usePerformanceOverview(params.course, params.range);
  const selected = courses.data?.find((course) => course._id === params.course);

  return (
    <Box>
      <PerformanceHeader
        courseLabel={selected?.title ?? t('insights.performance.allCourses')}
        onChooseCourse={() => {
          setDrawerOpen(true);
        }}
      />
      {/* The previous numbers stay while another course or range loads; an error replaces them */}
      <QueryState isLoading={false} error={overview.error} onRetry={() => void overview.refetch()}>
        <PerformanceStats data={overview.data} />
        <PerformanceControls
          metric={params.metric}
          range={params.range}
          chart={params.chart}
          onChange={setParams}
        />
        <PerformanceChartPanel
          data={overview.data}
          params={params}
          isFetching={overview.isFetching}
        />
      </QueryState>
      <CourseSelectDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        courses={courses}
        selectedId={params.course}
        onSelect={(courseId) => {
          setParams({ course: courseId === ALL_COURSES ? undefined : courseId });
          setDrawerOpen(false);
        }}
      />
    </Box>
  );
};
