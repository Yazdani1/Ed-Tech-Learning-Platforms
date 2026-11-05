'use client';

import { getCoursePriceInfo } from '@/utils/price';

import { DirectPriceHeader } from './DirectPriceHeader';
import { DirectPurchaseActions } from './DirectPurchaseActions';
import { PurchaseChoice } from './PurchaseChoice';
import { SubscriptionDetails } from './SubscriptionDetails';
import { useEnrollAction } from './useEnrollAction';

import type { SubscriptionState } from './subscription-state';
import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PurchaseOptionsProps {
  course: Course;
  subscription: SubscriptionState;
  isStudent: boolean;
  isSignedIn: boolean;
}

/** Guests and students not yet enrolled: get the course with a subscription plan, or directly. */
export const PurchaseOptions: FC<PurchaseOptionsProps> = ({
  course,
  subscription,
  isStudent,
  isSignedIn,
}) => {
  const { enroll, enrolling } = useEnrollAction(course);
  const price = getCoursePriceInfo(course);
  const shared = { isStudent, isSignedIn, enrolling };
  const direct = (
    <DirectPurchaseActions
      courseId={course._id}
      price={price}
      {...shared}
      onEnroll={() => {
        enroll(false);
      }}
    />
  );

  if (!subscription.courseInSubscription) {
    return (
      <>
        <DirectPriceHeader price={price} />
        {direct}
      </>
    );
  }
  return (
    <PurchaseChoice
      lowestPrice={subscription.lowestPrice}
      price={price}
      direct={direct}
      subscription={
        <SubscriptionDetails
          allowedPlans={course.allowedSubscriptionPlans}
          subscription={subscription}
          {...shared}
          onEnroll={() => {
            enroll(true);
          }}
        />
      }
    />
  );
};
