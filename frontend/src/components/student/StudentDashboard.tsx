'use client';

import CardMembership from '@mui/icons-material/CardMembership';
import MenuBook from '@mui/icons-material/MenuBook';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/api/profile.api';
import { useMyEnrollments } from '@/api/catalog.api';
import { PageHeader } from '@/components/common/PageHeader';
import { getCurrentPlan } from '@/components/profile/subscription.utils';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateTime';

import { ContinueLearning } from './ContinueLearning';
import { DashboardStatCard } from './DashboardStatCard';

/** /student/dashboard: welcome, enrolment and subscription summary, and the newest courses. */
export const StudentDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const enrollments = useMyEnrollments();
  const profile = useProfile();
  const plan = getCurrentPlan(profile.data?.activeSubscription);

  return (
    <Box>
      <PageHeader
        title={t('nav.dashboard')}
        subtitle={t('student.welcome', { name: user?.name ?? '' })}
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          mb: 3,
        }}
      >
        <DashboardStatCard
          icon={<MenuBook />}
          label={t('student.enrolledCourses')}
          value={enrollments.data?.length ?? '–'}
          helper={t('student.enrolledHelper')}
          loading={enrollments.isPending}
        />
        <DashboardStatCard
          icon={<CardMembership />}
          label={t('student.subscription')}
          value={plan?.plan ?? t('student.noPlan')}
          helper={
            plan
              ? t('student.planExpires', { date: formatDate(plan.endDate) })
              : t('student.noPlanHelper')
          }
          loading={profile.isPending}
        />
      </Box>
      {!profile.isPending && !plan && (
        <Box sx={{ mb: 3 }}>
          <Button component={Link} href="/pricing" variant="outlined">
            {t('student.viewPlans')}
          </Button>
        </Box>
      )}
      <ContinueLearning
        courses={enrollments.data}
        isLoading={enrollments.isPending}
        error={enrollments.error}
        onRetry={() => void enrollments.refetch()}
      />
    </Box>
  );
};
