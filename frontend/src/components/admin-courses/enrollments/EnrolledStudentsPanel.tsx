'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCourseStudents } from '@/api/enrollment.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { useCourseStudentColumns } from '@/components/enrollments/useCourseStudentColumns';

import type { EnrollmentType } from '@/schemas/catalog.schema';
import type { FC } from 'react';

type TypeFilter = 'all' | EnrollmentType;
const TYPE_FILTERS: readonly TypeFilter[] = ['all', 'free', 'paid', 'subscription'];

interface EnrolledStudentsPanelProps {
  courseId: string;
}

/** "Enrolled Students": every enrolment of the course, filtered by type (all, free, paid, subscription). */
export const EnrolledStudentsPanel: FC<EnrolledStudentsPanelProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const headingId = useId();
  const [filter, setFilter] = useState<TypeFilter>('all');
  const students = useCourseStudents(courseId);
  const columns = useCourseStudentColumns(true);
  const rows = useMemo(
    () => (students.data ?? []).filter((row) => filter === 'all' || row.enrollmentType === filter),
    [students.data, filter],
  );

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography id={headingId} component="h2" variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        {t('adminCourses.enrollments.enrolledStudents')}
      </Typography>
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Tabs
          value={filter}
          onChange={(_event, value: TypeFilter) => {
            setFilter(value);
          }}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label={t('adminCourses.enrollments.typeTabs')}
          sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
        >
          {TYPE_FILTERS.map((value) => (
            <Tab key={value} value={value} label={t(`adminCourses.enrollments.types.${value}`)} />
          ))}
        </Tabs>
        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
          <ResponsiveDataView
            isLoading={students.isLoading}
            error={students.error}
            onRetry={() => void students.refetch()}
            emptyText={t('adminCourses.enrollments.noStudents')}
            rows={rows}
            columns={columns}
            getRowId={(row) => row._id}
            label={t('adminCourses.enrollments.studentsLabel')}
          />
        </Box>
      </Paper>
    </Box>
  );
};
