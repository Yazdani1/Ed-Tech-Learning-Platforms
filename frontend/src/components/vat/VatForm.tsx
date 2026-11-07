'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateVat } from '@/api/site-settings.api';
import { useConfirm } from '@/hooks/useConfirm';
import { useFieldError } from '@/hooks/useFieldError';
import { vatFormSchema, type VatForm as VatValues } from '@/schemas/site-settings.schema';

import type { FC } from 'react';

interface VatFormProps {
  current: number;
}

/** The one VAT % field; saving asks for confirmation first (only new enrolments use the new rate). */
export const VatForm: FC<VatFormProps> = ({ current }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const fieldError = useFieldError();
  const save = useUpdateVat();
  const form = useForm<VatValues>({
    resolver: zodResolver(vatFormSchema),
    defaultValues: { vatPercent: current },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async ({ vatPercent }) => {
    const ok = await confirm({
      title: t('vat.confirmTitle'),
      message: t('vat.confirmMessage', { from: current, to: vatPercent }),
      confirmLabel: t('vat.save'),
    });
    if (!ok) return;
    save.mutate(vatPercent, {
      onSuccess: (setting) => {
        form.reset({ vatPercent: setting.vatPercent });
        toast.success(t('vat.saved', { percent: setting.vatPercent }));
      },
    });
  });

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={(event) => void onSubmit(event)}>
      {save.error && <Alert severity="error">{save.error.message}</Alert>}
      <TextField
        {...form.register('vatPercent', { valueAsNumber: true })}
        type="number"
        label={t('vat.label')}
        slotProps={{
          htmlInput: { min: 0, max: 100, step: 0.01, inputMode: 'decimal' },
          input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
        }}
        sx={{ maxWidth: 240 }}
        {...fieldError(errors.vatPercent)}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={!isDirty || save.isPending}
        sx={{ alignSelf: 'flex-start', minHeight: 44 }}
      >
        {t('vat.save')}
      </Button>
    </Stack>
  );
};
