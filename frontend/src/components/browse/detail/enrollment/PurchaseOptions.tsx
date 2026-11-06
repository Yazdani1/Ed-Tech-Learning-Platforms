'use client';

import { CouponField } from '@/components/coupon-field/CouponField';
import { useAppliedCoupon } from '@/components/coupon-field/useAppliedCoupon';
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

/** Guests and students not yet enrolled: get the course with a subscription plan, or directly (with a coupon). */
export const PurchaseOptions: FC<PurchaseOptionsProps> = ({
  course,
  subscription,
  isStudent,
  isSignedIn,
}) => {
  const { enroll, enrolling } = useEnrollAction(course);
  const coupon = useAppliedCoupon(course);
  const base = getCoursePriceInfo(course);
  // A paid course shows the price with the applied coupon (one per order; removing it shows the list price)
  const price = base.isFree ? base : coupon.price;
  const couponField = base.isFree ? null : <CouponField coupon={coupon} />;
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
        {couponField}
        {direct}
      </>
    );
  }
  return (
    <PurchaseChoice
      lowestPrice={subscription.lowestPrice}
      price={price}
      direct={
        <>
          {couponField}
          {direct}
        </>
      }
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
