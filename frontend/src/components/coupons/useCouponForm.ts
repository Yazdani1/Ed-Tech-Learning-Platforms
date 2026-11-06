'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSaveCoupon, useSuggestCouponCode } from '@/api/coupons.api';
import { couponFormSchema, type CouponForm, type CourseCoupon } from '@/schemas/coupon.schema';
import { fromLocalInput, toDateTimeInput } from '@/utils/dateTime';
import { toastError } from '@/utils/toast-error';

import type { ApiError } from '@/services/http.service';

export interface CouponFormState {
  form: UseFormReturn<CouponForm>;
  submit: () => void;
  saving: boolean;
  error: ApiError | null;
}

const formValues = (coupon: CourseCoupon | undefined): CouponForm => ({
  code: coupon?.code ?? '',
  discountType: coupon?.discountType ?? 'percent',
  value: coupon ? String(coupon.value) : '',
  unlimited: !coupon?.usageLimit,
  usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : '',
  startsAt: toDateTimeInput(coupon?.startsAt),
  endsAt: toDateTimeInput(coupon?.endsAt),
});

/** The coupon form: filled from the coupon (a new one gets a suggested code), saved with a toast. */
export const useCouponForm = (
  courseId: string,
  open: boolean,
  coupon: CourseCoupon | undefined,
  onDone: () => void,
): CouponFormState => {
  const { t } = useTranslation();
  const save = useSaveCoupon(courseId);
  const form = useForm<CouponForm>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: formValues(undefined),
  });
  const { reset, setValue } = form;
  const { mutateAsync: suggestCode } = useSuggestCouponCode();
  const { reset: resetMutation } = save;

  useEffect(() => {
    if (!open) return;
    reset(formValues(coupon));
    resetMutation();
    if (!coupon) {
      suggestCode()
        .then((code) => {
          setValue('code', code);
        })
        .catch(toastError);
    }
  }, [open, coupon, reset, resetMutation, setValue, suggestCode]);

  const submit = form.handleSubmit((values) => {
    save.mutate(
      {
        courseId,
        id: coupon?._id,
        body: {
          code: values.code.toUpperCase(),
          discountType: values.discountType,
          value: Number(values.value),
          usageLimit: values.unlimited ? null : Number(values.usageLimit),
          startsAt: fromLocalInput(values.startsAt) ?? '',
          endsAt: fromLocalInput(values.endsAt) ?? '',
        },
      },
      {
        onSuccess: () => {
          toast.success(t(coupon ? 'coupons.updated' : 'coupons.created'));
          onDone();
        },
      },
    );
  });

  return { form, submit: () => void submit(), saving: save.isPending, error: save.error };
};
