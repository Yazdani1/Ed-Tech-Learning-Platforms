'use client';

import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

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
  lectureCount: number;
  isStudent: boolean;
  isSignedIn: boolean;
}

/** Guests and students not yet enrolled: get the course with a subscription plan, or directly. */
export const PurchaseOptions: FC<PurchaseOptionsProps> = ({
  course,
  subscription,
  lectureCount,
  isStudent,
  isSignedIn,
}) => {
  const { t } = useTranslation();
  const { enroll, enrolling } = useEnrollAction(course);
  const price = getCoursePriceInfo(course);
  const shared = { isStudent, isSignedIn, enrolling };
  const direct = (
    <DirectPurchaseActions
      price={price}
      {...shared}
      onEnroll={() => {
        enroll(false);
      }}
    />
  );

  return (
    <>
      {subscription.courseInSubscription ? (
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
      ) : (
        <>
          <DirectPriceHeader price={price} />
          <Box sx={{ mt: 1.5 }}>{direct}</Box>
        </>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}
      >
        <OndemandVideoIcon sx={{ fontSize: 16 }} aria-hidden />
        {t('browse.enroll.onDemand', { count: lectureCount })}
      </Typography>
    </>
  );
};
