'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteCoupon, useSaveCoupon } from '@/api/coupons.api';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import type { CourseCoupon } from '@/schemas/coupon.schema';

/** Switch a coupon on / off and delete it (asks first; the server refuses a used one with a message). */
export const useCouponActions = (courseId: string) => {
  const { t } = useTranslation();
  const save = useSaveCoupon(courseId);
  const remove = useDeleteCoupon(courseId);
  const confirmDelete = useDeleteConfirm();
  return {
    onToggle: (coupon: CourseCoupon): void => {
      save.mutate(
        { courseId, id: coupon._id, body: { isActive: !coupon.isActive } },
        {
          onSuccess: () =>
            toast.success(t(coupon.isActive ? 'coupons.deactivated' : 'coupons.activated')),
          onError: (error) => toast.error(error.message),
        },
      );
    },
    onDelete: (coupon: CourseCoupon): void => {
      void confirmDelete(coupon.code).then((ok) => {
        if (!ok) return;
        remove.mutate(coupon._id, {
          onSuccess: () => toast.success(t('coupons.deleted')),
          onError: (error) => toast.error(error.message),
        });
      });
    },
  };
};
