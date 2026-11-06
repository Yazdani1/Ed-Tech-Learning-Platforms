'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useEnroll } from '@/api/catalog.api';

import type { EnrollRequest } from '@/api/catalog.api';
import type { Course } from '@/schemas/browse.schema';

export interface EnrollAction {
  /**
   * `viaSubscription` false on a Paid course buys it directly (never silently through the plan); `order` adds
   * the coupon code and payment method of a direct purchase.
   */
  enroll: (
    viaSubscription: boolean,
    order?: Pick<EnrollRequest, 'couponCode' | 'paymentMethod'>,
  ) => void;
  enrolling: boolean;
}

/** Enrols the signed-in student and shows a toast with the result. */
export const useEnrollAction = (course: Course): EnrollAction => {
  const { t } = useTranslation();
  const mutation = useEnroll(course._id);
  return {
    enrolling: mutation.isPending,
    enroll: (viaSubscription, order = {}) => {
      const body: EnrollRequest =
        course.pricing === 'Paid' && !viaSubscription ? { enrollmentType: 'paid', ...order } : {};
      // mutateAsync, not mutate(body, { onSuccess }): the enrolment refresh remounts the card, and per-call
      // callbacks of `mutate` are dropped once the component that called it is gone (the toast never showed)
      void mutation
        .mutateAsync(body)
        .then(() => toast.success(t('browse.enroll.enrolled')))
        .catch((error: unknown) =>
          toast.error(error instanceof Error ? error.message : String(error)),
        );
    },
  };
};
