'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

import { useEnrollmentCheck } from '@/api/browse.api';
import { useMySubscription, useSubscriptionPlans } from '@/api/catalog.api';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_AREA_ROLES, STUDENT_ROLES } from '@/utils/roles';

import { findIntroVideoId } from '../../course-utils';

import { CourseShareButton } from './CourseShareButton';
import { EnrolledActions } from './EnrolledActions';
import { EnrollmentMedia } from './EnrollmentMedia';
import { PurchaseOptions } from './PurchaseOptions';
import { StaffCourseActions } from './StaffCourseActions';
import { getSubscriptionState } from './subscription-state';
import { useCourseHighlights } from './useCourseHighlights';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface CourseEnrollmentCardProps {
  course: Course;
  lectureCount: number;
}

/**
 * The sticky card beside the course: intro video, then staff actions, "Go to this course" for an enrolled
 * student, or the ways to get the course (subscription / direct) for everyone else; sharing at the bottom.
 */
export const CourseEnrollmentCard: FC<CourseEnrollmentCardProps> = ({ course, lectureCount }) => {
  const { user, hasRole, isLoading } = useAuth();
  const isStudent = hasRole(STUDENT_ROLES);
  const isStaff = hasRole(ADMIN_AREA_ROLES);
  const check = useEnrollmentCheck(course._id, isStudent);
  const plans = useSubscriptionPlans();
  const mySubscription = useMySubscription(isStudent);
  const staffHighlights = useCourseHighlights(course, lectureCount, true);
  const studentHighlights = useCourseHighlights(course, lectureCount, false);
  const waiting = isLoading || (isStudent && check.isPending);

  const renderBody = () => {
    if (waiting) return <Skeleton variant="rounded" height={160} aria-hidden />;
    if (isStaff) return <StaffCourseActions courseId={course._id} highlights={staffHighlights} />;
    if (isStudent && check.data?.isEnrolled) {
      return (
        <EnrolledActions
          courseId={course._id}
          enrolledAt={check.data.enrolledAt}
          highlights={studentHighlights}
        />
      );
    }
    return (
      <PurchaseOptions
        course={course}
        subscription={getSubscriptionState(course, plans.data ?? [], mySubscription.data)}
        isStudent={isStudent}
        isSignedIn={user !== null}
      />
    );
  };

  return (
    <Box sx={{ position: { md: 'sticky' }, top: { md: 90 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '18px',
          overflow: 'hidden',
          border: '1px solid #e7ebf1',
          boxShadow: '0 16px 40px rgba(15,23,42,0.14)',
        }}
      >
        <EnrollmentMedia
          title={course.title}
          coverImage={course.coverImage}
          introVideoId={findIntroVideoId(course)}
        />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {renderBody()}
          <Divider sx={{ mt: 2.5, mb: 1 }} />
          <CourseShareButton title={course.title} />
        </Box>
      </Paper>
    </Box>
  );
};
