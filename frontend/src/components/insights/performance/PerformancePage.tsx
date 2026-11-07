'use client';

import Box from '@mui/material/Box';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePerformanceCourses, usePerformanceOverview } from '@/api/insights.api';
import { QueryState } from '@/components/common/QueryState';
import { CoursePickerDrawer } from '@/components/course-picker/CoursePickerDrawer';
import { courseSelectionLabel } from '@/components/course-picker/course-picker.utils';

import { PerformanceChartPanel } from './PerformanceChartPanel';
import { PerformanceControls } from './PerformanceControls';
import { PerformanceHeader } from './PerformanceHeader';
import { PerformancePeriodCards } from './PerformancePeriodCards';
import { PerformanceSalesInsights } from './PerformanceSalesInsights';
import { usePerformanceParams } from './usePerformanceParams';

/**
 * /admin/performance (Super Admin): revenue and enrolments of all courses or the chosen ones, today / last
 * 7 days / this month / all time, a chart over a chosen range (including custom start and end days), and the
 * course sales charts (sales and VAT, enrolments, average order, types, top courses, list price split).
 */
export const PerformancePage = () => {
  const { t } = useTranslation();
  const { params, setParams, courseIds, filters, isReady } = usePerformanceParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const courses = usePerformanceCourses();
  const overview = usePerformanceOverview(filters, isReady);
  const pickerCourses = courses.data?.map((course) => ({ ...course, count: course.paidStudents }));

  return (
    <Box>
      <PerformanceHeader
        courseLabel={courseSelectionLabel(t, courseIds, courses.data)}
        onChooseCourse={() => {
          setDrawerOpen(true);
        }}
      />
      {/* The previous numbers stay while other courses or another range load; an error replaces them */}
      <QueryState isLoading={false} error={overview.error} onRetry={() => void overview.refetch()}>
        <PerformancePeriodCards data={overview.data} />
        <PerformanceControls params={params} onChange={setParams} />
        <PerformanceChartPanel
          data={overview.data}
          params={params}
          isFetching={overview.isFetching}
          isReady={isReady}
        />
      </QueryState>
      <PerformanceSalesInsights courseIds={courseIds} />
      <CoursePickerDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
        }}
        title={t('coursePicker.title')}
        courses={{ ...courses, data: pickerCourses }}
        selectedIds={courseIds}
        countLabel={(count) => t('coursePicker.paidStudents', { count })}
        onApply={(ids) => {
          setParams({ courses: ids.join(',') });
          setDrawerOpen(false);
        }}
      />
    </Box>
  );
};
