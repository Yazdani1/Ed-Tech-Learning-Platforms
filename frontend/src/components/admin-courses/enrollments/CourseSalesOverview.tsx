'use client';

import { useRevenueSummary } from '@/api/revenue.api';
import { RevenueOverview } from '@/components/revenue/RevenueOverview';

import type { FC } from 'react';

interface CourseSalesOverviewProps {
  courseId: string;
}

/** This course's sales today / last 7 days / this month / all time with their VAT, and the daily, weekly or monthly chart. */
export const CourseSalesOverview: FC<CourseSalesOverviewProps> = ({ courseId }) => {
  const summary = useRevenueSummary({ type: 'all', courseIds: [courseId] });
  return (
    <RevenueOverview
      summary={summary.data}
      isPending={summary.isPending}
      error={summary.error}
      onRetry={() => void summary.refetch()}
    />
  );
};
