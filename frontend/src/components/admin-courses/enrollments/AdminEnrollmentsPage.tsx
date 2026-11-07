'use client';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';

import { studentsExportUrl } from '@/api/enrollment.api';
import { isCourseId, isNotFoundError, useCourse } from '@/api/browse.api';
import { useAuth } from '@/hooks/useAuth';
import { MANAGER_ROLES } from '@/utils/roles';

import { BackToCoursesButton } from '../BackToCoursesButton';

import { CourseOrdersPanel } from './CourseOrdersPanel';
import { EnrolledStudentsPanel } from './EnrolledStudentsPanel';
import { EnrollmentCourseHeader } from './EnrollmentCourseHeader';
import { CourseSalesOverview } from './CourseSalesOverview';
import { EnrollmentStatsStrip } from './EnrollmentStatsStrip';

import type { FC } from 'react';

interface AdminEnrollmentsPageProps {
  courseId: string;
}

/**
 * /admin/enrollments/[courseId]: who is enrolled, CSV export (all staff). Super Admin and Admin also see the
 * statistics and each enrolment's prices and coupon, with a details panel (the backend gives those to them only).
 */
export const AdminEnrollmentsPage: FC<AdminEnrollmentsPageProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canSeeRevenue = hasRole(MANAGER_ROLES);
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
          !canSeeRevenue && (
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
          )
        }
      />
      {canSeeRevenue && <EnrollmentStatsStrip courseId={courseId} />}
      {canSeeRevenue && <CourseSalesOverview courseId={courseId} />}
      {canSeeRevenue ? (
        <CourseOrdersPanel courseId={courseId} courseTitle={course.data?.title ?? ''} />
      ) : (
        <EnrolledStudentsPanel courseId={courseId} />
      )}
    </Box>
  );
};
