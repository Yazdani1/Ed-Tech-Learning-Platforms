'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { studentsExportUrl } from '@/api/enrollment.api';
import { isCourseId, isNotFoundError, useCourse } from '@/api/browse.api';
import { useAuth } from '@/hooks/useAuth';
import { MANAGER_ROLES } from '@/utils/roles';

import { BackToCoursesButton } from '../BackToCoursesButton';

import { EnrolledStudentsPanel } from './EnrolledStudentsPanel';
import { EnrollmentCourseHeader } from './EnrollmentCourseHeader';
import { EnrollmentStatsStrip } from './EnrollmentStatsStrip';
import { EnrollmentViewTabs, type EnrollmentView } from './EnrollmentViewTabs';
import { RevenuePanel } from './RevenuePanel';

import type { FC } from 'react';

interface AdminEnrollmentsPageProps {
  courseId: string;
}

/**
 * /admin/enrollments/[courseId]: who is enrolled, CSV export (all staff). Super Admin and Admin also see the
 * statistics and the revenue view (the backend gives those endpoints to them only).
 */
export const AdminEnrollmentsPage: FC<AdminEnrollmentsPageProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canSeeRevenue = hasRole(MANAGER_ROLES);
  const [view, setView] = useState<EnrollmentView>('students');
  const course = useCourse(courseId);
  const notFound = !isCourseId(courseId) || (course.isError && isNotFoundError(course.error));

  if (notFound) {
    return (
      <Box>
        <BackToCoursesButton />
        <Alert severity="warning">{t('adminCourses.enrollments.notFound')}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <BackToCoursesButton />
      <EnrollmentCourseHeader
        course={course.data}
        isLoading={course.isLoading}
        actions={
          <Button
            component="a"
            href={studentsExportUrl(courseId)}
            download
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            sx={{ minHeight: 44 }}
          >
            {t('adminCourses.enrollments.exportCsv')}
          </Button>
        }
      />
      {canSeeRevenue && <EnrollmentStatsStrip courseId={courseId} />}
      {canSeeRevenue && <EnrollmentViewTabs view={view} onChange={setView} />}
      {view === 'revenue' && canSeeRevenue ? (
        <RevenuePanel courseId={courseId} />
      ) : (
        <EnrolledStudentsPanel courseId={courseId} />
      )}
    </Box>
  );
};
