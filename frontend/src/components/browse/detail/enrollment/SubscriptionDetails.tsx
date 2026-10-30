'use client';

import { SubscriptionCovered } from './SubscriptionCovered';
import { SubscriptionPitch } from './SubscriptionPitch';
import { SubscriptionUpgrade } from './SubscriptionUpgrade';

import type { SubscriptionState } from './subscription-state';
import type { FC } from 'react';

interface SubscriptionDetailsProps {
  allowedPlans: readonly string[];
  subscription: SubscriptionState;
  isStudent: boolean;
  isSignedIn: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}

/** The open subscription option: enrol with the plan, upgrade the plan, or see the plans. */
export const SubscriptionDetails: FC<SubscriptionDetailsProps> = ({
  allowedPlans,
  subscription,
  isStudent,
  isSignedIn,
  enrolling,
  onEnroll,
}) => {
  const { active, planCourseCounts } = subscription;
  if (isStudent && active && subscription.coversCourse) {
    return (
      <SubscriptionCovered
        plan={active.plan}
        endDate={active.endDate}
        planCourseCount={planCourseCounts[active.plan] ?? 0}
        enrolling={enrolling}
        onEnroll={onEnroll}
      />
    );
  }
  if (isStudent && active && subscription.needsUpgrade) {
    return (
      <SubscriptionUpgrade
        currentPlan={active.plan}
        requiredPlans={allowedPlans}
        planCourseCounts={planCourseCounts}
      />
    );
  }
  return (
    <SubscriptionPitch
      plans={allowedPlans}
      planCourseCounts={planCourseCounts}
      isSignedIn={isSignedIn}
    />
  );
};
