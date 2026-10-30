'use client';

import AccountCircle from '@mui/icons-material/AccountCircle';
import CardMembership from '@mui/icons-material/CardMembership';
import MenuBook from '@mui/icons-material/MenuBook';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { useTeacherCourseCount } from '@/api/profile.api';
import { useMyEnrollments } from '@/api/catalog.api';
import { formatDate } from '@/utils/dateTime';

import { ProfileStatCard } from './ProfileStatCard';
import { getCurrentPlan } from './subscription.utils';

import type { Profile } from '@/schemas/profile.schema';
import type { FC } from 'react';

const STAT_SIZE = { xs: 12, sm: 6, md: 3 } as const;

interface ProfileStatsProps {
  profile: Profile;
}

/** Course count (enrolled for students, assigned for teachers), purchases, plan and profile status. */
export const ProfileStats: FC<ProfileStatsProps> = ({ profile }) => {
  const { t } = useTranslation();
  const isStudent = profile.role === 'Student';
  const isTeacher = profile.role === 'Teacher';
  // Each endpoint only answers its own role (403 otherwise), so only that role asks
  const enrollments = useMyEnrollments(isStudent);
  const teacherCourses = useTeacherCourseCount(isTeacher);
  const plan = getCurrentPlan(profile.activeSubscription);

  const courseCount = isStudent
    ? (enrollments.data?.length ?? 0)
    : isTeacher
      ? (teacherCourses.data ?? 0)
      : 0;
  const courseLoading =
    (isStudent && enrollments.isPending) || (isTeacher && teacherCourses.isPending);

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={STAT_SIZE}>
        <ProfileStatCard
          icon={<MenuBook />}
          label={t(isTeacher ? 'profile.assignedCourses' : 'profile.enrolledCourses')}
          value={String(courseCount)}
          helper={t(isTeacher ? 'profile.assignedHelper' : 'profile.enrolledHelper')}
          loading={courseLoading}
        />
      </Grid>
      <Grid size={STAT_SIZE}>
        <ProfileStatCard
          icon={<SchoolOutlined />}
          label={t('profile.purchasedCourses')}
          value={String(profile.purchasedCourses.length)}
          helper={t('profile.purchasedHelper')}
        />
      </Grid>
      <Grid size={STAT_SIZE}>
        <ProfileStatCard
          icon={<CardMembership />}
          label={t('profile.subscription')}
          value={plan?.plan ?? t('profile.none')}
          helper={
            plan
              ? t('profile.expires', { date: formatDate(plan.endDate) })
              : t('profile.noActivePlan')
          }
        />
      </Grid>
      <Grid size={STAT_SIZE}>
        <ProfileStatCard
          icon={<AccountCircle />}
          label={t('profile.profileStatus')}
          value={t(profile.avatar ? 'profile.statusComplete' : 'profile.statusBasic')}
          helper={t(profile.avatar ? 'profile.avatarAdded' : 'profile.addAvatar')}
        />
      </Grid>
    </Grid>
  );
};
