'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSuggestCouponCode } from '@/api/coupons.api';
import { useSavePromo } from '@/api/promos.api';
import { promoFormSchema, type Promo, type PromoForm } from '@/schemas/promo.schema';
import { fromLocalInput, toDateTimeInput } from '@/utils/dateTime';
import { toastError } from '@/utils/toast-error';

import type { ApiError } from '@/services/http.service';

export interface PromoFormState {
  form: UseFormReturn<PromoForm>;
  submit: () => void;
  saving: boolean;
  error: ApiError | null;
}

const formValues = (promo: Promo | undefined): PromoForm => ({
  title: promo?.title ?? '',
  code: promo?.code ?? '',
  discountType: promo?.discountType ?? 'percent',
  value: promo ? String(promo.value) : '',
  startsAt: toDateTimeInput(promo?.startsAt),
  endsAt: toDateTimeInput(promo?.endsAt),
  courseIds: promo?.courses.flatMap((course) => (course ? [course._id] : [])) ?? [],
});

/** The promo form: filled from the promo (a new one gets a suggested code), saved with a toast. */
export const usePromoForm = (
  open: boolean,
  promo: Promo | undefined,
  onDone: () => void,
): PromoFormState => {
  const { t } = useTranslation();
  const save = useSavePromo();
  const form = useForm<PromoForm>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: formValues(undefined),
  });
  const { reset, setValue } = form;
  const { mutateAsync: suggestCode } = useSuggestCouponCode();
  const { reset: resetMutation } = save;

  useEffect(() => {
    if (!open) return;
    reset(formValues(promo));
    resetMutation();
    if (!promo) {
      suggestCode()
        .then((code) => {
          setValue('code', code);
        })
        .catch(toastError);
    }
  }, [open, promo, reset, resetMutation, setValue, suggestCode]);

  const submit = form.handleSubmit((values) => {
    save.mutate(
      {
        id: promo?._id,
        body: {
          title: values.title.trim(),
          code: values.code.toUpperCase(),
          discountType: values.discountType,
          value: Number(values.value),
          startsAt: fromLocalInput(values.startsAt) ?? '',
          endsAt: fromLocalInput(values.endsAt) ?? '',
          courseIds: values.courseIds,
        },
      },
      {
        onSuccess: () => {
          toast.success(t(promo ? 'promos.updated' : 'promos.created'));
          onDone();
        },
      },
    );
  });

  return { form, submit: () => void submit(), saving: save.isPending, error: save.error };
};
