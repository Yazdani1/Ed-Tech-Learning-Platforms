'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useAssignSubscription } from '@/api/people.api';
import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import { assignFormSchema, type AssignForm } from '@/schemas/people.schema';
import { fromLocalInput } from '@/utils/dateTime';

import { AssignEndDateField } from './AssignEndDateField';
import { AssignPlanFields } from './AssignPlanFields';
import { UserPicker } from './UserPicker';
import { firstBillingDuration, isInFuture } from './plan-utils';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface AssignSubscriptionModalProps {
  open: boolean;
  plans: SubscriptionPlan[];
  onClose: () => void;
}

/** End of the chosen day in the viewer's time zone, as UTC ISO. */
const endOfDay = (date: string): string | null => fromLocalInput(`${date}T23:59`);

/** Give a user a plan until a chosen date (today or later); their other active plans are cancelled. */
export const AssignSubscriptionModal: FC<AssignSubscriptionModalProps> = ({
  open,
  plans,
  onClose,
}) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const assign = useAssignSubscription();
  const form = useForm<AssignForm>({ resolver: zodResolver(assignFormSchema) });
  const { reset, setValue, setError } = form;
  const { reset: resetAssign } = assign;

  useEffect(() => {
    if (!open) return;
    const [first] = plans;
    reset({
      userId: '',
      plan: first?.plan ?? '',
      billingDuration: firstBillingDuration(first),
      endDate: '',
    });
    resetAssign();
  }, [open, plans, reset, resetAssign]);

  const onSave = form.handleSubmit((values) => {
    const endDate = endOfDay(values.endDate);
    if (!isInFuture(endDate)) {
      setError('endDate', { message: 'people.subscriptions.endDateFuture' });
      return;
    }
    void assign
      .mutateAsync({ ...values, billingDuration: Number(values.billingDuration), endDate })
      .then(() => {
        toast.success(t('people.subscriptions.assigned'));
        onClose();
      })
      // The error is shown in the dialog (assign.error)
      .catch(() => undefined);
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('people.subscriptions.assignTitle')}
      onSave={() => void onSave()}
      saveLabel={t('people.subscriptions.assign')}
      saving={assign.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {assign.error && <Alert severity="error">{assign.error.message}</Alert>}
        <UserPicker
          onChange={(userId) => {
            setValue('userId', userId, { shouldValidate: form.formState.isSubmitted });
          }}
          {...fieldError(form.formState.errors.userId)}
        />
        <AssignPlanFields form={form} plans={plans} />
        <AssignEndDateField form={form} />
      </Stack>
    </AppModal>
  );
};
