'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSavePlan } from '@/api/people.api';
import { AppModal } from '@/components/common/AppModal';
import { useFieldError } from '@/hooks/useFieldError';
import { planFormSchema, type PlanForm } from '@/schemas/people.schema';

import { PlanBillingFields } from './PlanBillingFields';
import { PlanFeatureFields } from './PlanFeatureFields';
import { EMPTY_PLAN_FORM, toPlanForm, toPlanRequest } from './plan-utils';

import type { SubscriptionPlan } from '@/schemas/catalog.schema';
import type { FC } from 'react';

interface PlanFormModalProps {
  open: boolean;
  /** The plan being edited; undefined to add one */
  plan: SubscriptionPlan | undefined;
  onClose: () => void;
}

/** Create or edit a plan (saved by name: an existing name is updated). */
export const PlanFormModal: FC<PlanFormModalProps> = ({ open, plan, onClose }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const save = useSavePlan();
  const form = useForm<PlanForm>({
    resolver: zodResolver(planFormSchema),
    defaultValues: EMPTY_PLAN_FORM,
  });
  const { reset } = form;
  const { reset: resetSave } = save;

  useEffect(() => {
    if (!open) return;
    reset(toPlanForm(plan));
    resetSave();
  }, [open, plan, reset, resetSave]);

  const onSave = form.handleSubmit((values) => {
    void save
      .mutateAsync(toPlanRequest(values))
      .then(() => {
        toast.success(t('people.plans.saved'));
        onClose();
      })
      .catch(() => undefined);
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t(plan ? 'people.plans.editTitle' : 'people.plans.addTitle')}
      onSave={() => void onSave()}
      saveLabel={t('common.save')}
      saving={save.isPending}
    >
      <Stack spacing={3} sx={{ pt: 1 }}>
        {save.error && <Alert severity="error">{save.error.message}</Alert>}
        <TextField
          {...form.register('plan')}
          label={t('people.plans.name')}
          placeholder={t('people.plans.namePlaceholder')}
          required
          fullWidth
          // The name is the plan's key: renaming would create a second plan
          slotProps={{ htmlInput: { readOnly: plan !== undefined } }}
          helperText={plan ? t('people.plans.nameLocked') : undefined}
          {...fieldError(form.formState.errors.plan)}
        />
        <PlanBillingFields form={form} />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField {...form.register('badge')} label={t('people.plans.badge')} fullWidth />
          <TextField
            {...form.register('color')}
            label={t('people.plans.color')}
            placeholder="#7c3aed"
            fullWidth
          />
        </Box>
        <PlanFeatureFields form={form} />
      </Stack>
    </AppModal>
  );
};
