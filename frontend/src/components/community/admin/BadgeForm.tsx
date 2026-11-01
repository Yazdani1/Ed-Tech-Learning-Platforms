'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SaveIcon from '@mui/icons-material/Save';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSaveBadge } from '@/api/community.api';
import { useFieldError } from '@/hooks/useFieldError';
import { useToastResult } from '@/hooks/useToastResult';
import {
  badgeFormSchema,
  type BadgeForm as BadgeFormValues,
  type CommunityBadge,
} from '@/schemas/community.schema';

import { FormButtons } from '../common/FormButtons';
import { ImagePickerField } from '../common/ImagePickerField';
import { useImagePicker } from '../common/useImagePicker';

import { toAdminFormData } from './form-data';

import type { FC } from 'react';

interface BadgeFormProps {
  /** The badge being edited; undefined to create one */
  badge: CommunityBadge | undefined;
  onDone: () => void;
}

/** Create or edit a badge: name, picture and the points needed to earn it. */
export const BadgeForm: FC<BadgeFormProps> = ({ badge, onDone }) => {
  const { t } = useTranslation();
  const save = useSaveBadge();
  const toastResult = useToastResult();
  const image = useImagePicker(1);
  const { register, handleSubmit, formState } = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: { name: badge?.name ?? '', requiredPoints: String(badge?.requiredPoints ?? 0) },
  });
  const fieldError = useFieldError();

  const submit = handleSubmit(async (values) => {
    const data = toAdminFormData(
      { name: values.name.trim(), requiredPoints: values.requiredPoints },
      image.files[0],
    );
    const saved = save.mutateAsync({ id: badge?._id ?? '', data });
    if (await toastResult(saved, t('community.admin.badgeSaved'))) onDone();
  });

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
      <Stack
        component="form"
        noValidate
        spacing={2}
        aria-label={t('community.admin.badgeFormLabel')}
        onSubmit={(event) => void submit(event)}
      >
        <TextField
          {...register('name')}
          label={t('community.admin.badgeName')}
          {...fieldError(formState.errors.name)}
        />
        <ImagePickerField
          picker={image}
          label={t('community.admin.uploadBadgeImage')}
          disabled={save.isPending}
        />
        <TextField
          {...register('requiredPoints')}
          label={t('community.admin.requiredPoints')}
          type="number"
          slotProps={{ htmlInput: { min: 0, inputMode: 'numeric' } }}
          {...fieldError(formState.errors.requiredPoints)}
        />
        <FormButtons
          submitLabel={
            badge ? t('community.admin.saveBadgeChanges') : t('community.admin.saveBadge')
          }
          onCancel={onDone}
          busy={save.isPending}
          startIcon={<SaveIcon />}
        />
      </Stack>
    </Paper>
  );
};
