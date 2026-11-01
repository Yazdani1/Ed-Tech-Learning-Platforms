'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SaveIcon from '@mui/icons-material/Save';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSaveChannel } from '@/api/community.api';
import { RichTextField } from '@/components/common/rich-text/RichTextField';
import { useFieldError } from '@/hooks/useFieldError';
import { useToastResult } from '@/hooks/useToastResult';
import {
  channelFormSchema,
  type ChannelForm as ChannelFormValues,
  type CommunityChannel,
} from '@/schemas/community.schema';

import { FormButtons } from '../common/FormButtons';
import { ImagePickerField } from '../common/ImagePickerField';
import { useImagePicker } from '../common/useImagePicker';

import { toAdminFormData } from './form-data';

import type { FC } from 'react';

const EDITOR_MIN_HEIGHT = 140;

interface ChannelFormProps {
  /** The channel being edited; undefined to create one */
  channel: CommunityChannel | undefined;
  onDone: () => void;
}

/** Create or edit a hub channel: name, rich text description, picture. */
export const ChannelForm: FC<ChannelFormProps> = ({ channel, onDone }) => {
  const { t } = useTranslation();
  const save = useSaveChannel();
  const toastResult = useToastResult();
  const image = useImagePicker(1);
  const fieldError = useFieldError();
  const { control, register, handleSubmit, formState } = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: { name: channel?.name ?? '', description: channel?.description ?? '' },
  });

  const submit = handleSubmit(async (values) => {
    const data = toAdminFormData(
      { name: values.name.trim(), description: values.description },
      image.files[0],
    );
    const saved = save.mutateAsync({ id: channel?._id ?? '', data });
    if (await toastResult(saved, t('community.admin.channelSaved'))) onDone();
  });

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
      <Stack
        component="form"
        noValidate
        spacing={2}
        aria-label={t('community.admin.channelFormLabel')}
        onSubmit={(event) => void submit(event)}
      >
        <TextField
          {...register('name')}
          label={t('community.admin.channelName')}
          {...fieldError(formState.errors.name)}
        />
        <RichTextField
          control={control}
          name="description"
          label={t('community.admin.channelDescription')}
          placeholder={t('community.admin.channelPlaceholder')}
          minHeight={EDITOR_MIN_HEIGHT}
          features="basic"
        />
        <ImagePickerField
          picker={image}
          label={t('community.admin.uploadChannelImage')}
          disabled={save.isPending}
        />
        <FormButtons
          submitLabel={
            channel ? t('community.admin.saveChannelChanges') : t('community.admin.saveChannel')
          }
          onCancel={onDone}
          busy={save.isPending}
          startIcon={<SaveIcon />}
        />
      </Stack>
    </Paper>
  );
};
