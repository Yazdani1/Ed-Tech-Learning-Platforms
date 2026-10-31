'use client';

import Category from '@mui/icons-material/Category';
import PaidOutlined from '@mui/icons-material/PaidOutlined';
import People from '@mui/icons-material/People';
import Person from '@mui/icons-material/Person';
import QuestionAnswerOutlined from '@mui/icons-material/QuestionAnswerOutlined';
import School from '@mui/icons-material/School';
import SubscriptionsOutlined from '@mui/icons-material/SubscriptionsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { InsightStatCard } from '../InsightStatCard';
import { formatMoney } from '../insights.utils';

import type { DashboardTotals } from '@/schemas/insights.schema';
import type { TFunction } from 'i18next';
import type { FC, ReactNode } from 'react';

interface StatConfig {
  key: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  helper: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

const dashboardT =
  (t: TFunction): Translate =>
  (key, options) =>
    t(`insights.dashboard.${key}`, options);

/** First row: revenue, students, courses, subscriptions (the old dashboard's order). */
const buildMainStats = (d: Translate, totals: DashboardTotals): StatConfig[] => [
  {
    key: 'revenue',
    icon: <PaidOutlined />,
    label: d('totalRevenue'),
    value: formatMoney(totals.totalRevenue),
    helper: d('thisMonthRevenue', { amount: formatMoney(totals.thisMonthRevenue) }),
  },
  {
    key: 'students',
    icon: <People />,
    label: d('students'),
    value: totals.students,
    helper: d('thisMonthEnrollments', { count: totals.thisMonthEnrollments }),
  },
  {
    key: 'courses',
    icon: <School />,
    label: d('courses'),
    value: totals.courses,
    helper: d('courseSplit', { published: totals.publishedCourses, draft: totals.draftCourses }),
  },
  {
    key: 'subscriptions',
    icon: <SubscriptionsOutlined />,
    label: d('activeSubscriptions'),
    value: totals.activeSubscriptions,
    helper: d('subscriptionRevenue', { amount: formatMoney(totals.subscriptionRevenue) }),
  },
];

/** Second row: teachers, categories, open questions, course revenue. */
const buildMoreStats = (d: Translate, totals: DashboardTotals): StatConfig[] => [
  {
    key: 'teachers',
    icon: <Person />,
    label: d('teachers'),
    value: totals.teachers,
    helper: d('teachersHelper'),
  },
  {
    key: 'categories',
    icon: <Category />,
    label: d('categories'),
    value: totals.categories,
    helper: d('categoriesHelper'),
  },
  {
    key: 'questions',
    icon: <QuestionAnswerOutlined />,
    label: d('openQuestions'),
    value: totals.openQuestions,
    helper: d('openQuestionsHelper'),
  },
  {
    key: 'courseRevenue',
    icon: <TrendingUpOutlined />,
    label: d('courseRevenue'),
    value: formatMoney(totals.courseRevenue),
    helper: d('totalEnrollments', { count: totals.enrollments }),
  },
];

const buildStats = (t: TFunction, totals: DashboardTotals): StatConfig[] => {
  const d = dashboardT(t);
  return [...buildMainStats(d, totals), ...buildMoreStats(d, totals)];
};

interface DashboardStatGridProps {
  totals: DashboardTotals;
}

/** The eight headline numbers: one column on phones, two on tablets, four on desktop. */
export const DashboardStatGrid: FC<DashboardStatGridProps> = ({ totals }) => {
  const { t } = useTranslation();
  return (
    <Box
      component="section"
      aria-label={t('insights.dashboard.title')}
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))',
        },
        mb: 3,
      }}
    >
      {buildStats(t, totals).map(({ key, ...stat }) => (
        <InsightStatCard key={key} {...stat} />
      ))}
    </Box>
  );
};
