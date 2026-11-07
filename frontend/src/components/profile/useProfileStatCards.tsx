'use client';

import AccessTime from '@mui/icons-material/AccessTime';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CardMembership from '@mui/icons-material/CardMembership';
import MenuBook from '@mui/icons-material/MenuBook';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import { useTranslation } from 'react-i18next';

import { useMyEnrollments } from '@/api/catalog.api';
import { useMyTeacherCourseCount } from '@/api/teacher.api';
import { formatDate } from '@/utils/dateTime';
import { formatDuration } from '@/utils/duration';

import { getCurrentPlan } from './subscription.utils';

import type { Profile } from '@/schemas/profile.schema';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';

export interface StatCard {
  key: string;
  icon: ReactElement;
  label: string;
  value: string;
  helper: string;
  loading?: boolean;
}

/** The numbers of a course list: enrolled (students) or assigned (teachers). */
const useCourseCount = (profile: Profile) => {
  const isStudent = profile.role === 'Student';
  const isTeacher = profile.role === 'Teacher';
  // Each endpoint only answers its own role (403 otherwise), so only that role asks
  const enrollments = useMyEnrollments(isStudent);
  const teacherCourses = useMyTeacherCourseCount(isTeacher);
  return {
    count: isStudent ? (enrollments.data?.length ?? 0) : isTeacher ? (teacherCourses.data ?? 0) : 0,
    loading: (isStudent && enrollments.isPending) || (isTeacher && teacherCourses.isPending),
    hasSubscriptionCourse: (enrollments.data ?? []).some(
      (course) => course.enrollmentType === 'subscription',
    ),
  };
};

const timeCard = (t: TFunction, profile: Profile): StatCard => ({
  key: 'time',
  icon: <AccessTime />,
  label: t('profile.timeSpent'),
  value: formatDuration(t, profile.timeSpentSeconds),
  helper: t('profile.timeSpentHelper'),
});

const planCard = (t: TFunction, profile: Profile): StatCard => {
  const plan = getCurrentPlan(profile.activeSubscription);
  return {
    key: 'plan',
    icon: <CardMembership />,
    label: t('profile.subscription'),
    value: plan?.plan ?? t('profile.none'),
    helper: plan
      ? t('profile.expires', { date: formatDate(plan.endDate) })
      : t('profile.noActivePlan'),
  };
};

/**
 * The profile's stat cards: courses (enrolled / assigned), purchases, time on the portal (students), plan
 * (students: only with a running plan or a course from a subscription) and profile status.
 */
export const useProfileStatCards = (profile: Profile): StatCard[] => {
  const { t } = useTranslation();
  const isStudent = profile.role === 'Student';
  const isTeacher = profile.role === 'Teacher';
  const courses = useCourseCount(profile);
  const showPlan =
    !isStudent ||
    getCurrentPlan(profile.activeSubscription) !== null ||
    courses.hasSubscriptionCourse;
  return [
    {
      key: 'courses',
      icon: <MenuBook />,
      label: t(isTeacher ? 'profile.assignedCourses' : 'profile.enrolledCourses'),
      value: String(courses.count),
      helper: t(isTeacher ? 'profile.assignedHelper' : 'profile.enrolledHelper'),
      loading: courses.loading,
    },
    {
      key: 'purchased',
      icon: <SchoolOutlined />,
      label: t('profile.purchasedCourses'),
      value: String(profile.purchasedCourses.length),
      helper: t('profile.purchasedHelper'),
    },
    ...(isStudent ? [timeCard(t, profile)] : []),
    ...(showPlan ? [planCard(t, profile)] : []),
    {
      key: 'status',
      icon: <AccountCircle />,
      label: t('profile.profileStatus'),
      value: t(profile.avatar ? 'profile.statusComplete' : 'profile.statusBasic'),
      helper: t(profile.avatar ? 'profile.avatarAdded' : 'profile.addAvatar'),
    },
  ];
};
