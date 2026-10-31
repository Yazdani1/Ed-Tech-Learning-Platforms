'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { ENROLLMENT_TYPE_COLOR, MONO_SX } from './enrollment-display';
import { StudentCell } from './StudentCell';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { CourseStudent } from '@/schemas/enrollment.schema';

/**
 * Columns of every enrolled-students list: student, type, date; staff admins (`showEmail`) also see the
 * email and the enrolment id (teachers never receive emails).
 */
export const useCourseStudentColumns = (showEmail: boolean): DataColumn<CourseStudent>[] => {
  const { t } = useTranslation();
  const columns: (DataColumn<CourseStudent> | false)[] = [
    {
      key: 'student',
      header: t('adminCourses.enrollments.columns.student'),
      render: (row) => <StudentCell student={row.student} />,
    },
    showEmail && {
      key: 'email',
      header: t('adminCourses.enrollments.columns.email'),
      render: (row) => row.student?.email ?? '—',
    },
    {
      key: 'type',
      header: t('adminCourses.enrollments.columns.type'),
      render: (row) => (
        <Chip
          label={t(`adminCourses.enrollments.types.${row.enrollmentType}`)}
          color={ENROLLMENT_TYPE_COLOR[row.enrollmentType]}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      key: 'date',
      header: t('adminCourses.enrollments.columns.enrolledOn'),
      render: (row) => formatDateTime(row.createdAt),
    },
    showEmail && {
      key: 'id',
      header: t('adminCourses.enrollments.columns.enrollmentId'),
      render: (row) => (
        <Box component="span" sx={MONO_SX}>
          {row._id}
        </Box>
      ),
      hideOnMobile: true,
    },
  ];
  return columns.filter((column): column is DataColumn<CourseStudent> => column !== false);
};
