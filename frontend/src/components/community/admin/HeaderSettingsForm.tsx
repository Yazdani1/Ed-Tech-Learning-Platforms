'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SaveIcon from '@mui/icons-material/Save';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useUpdateSettings } from '@/api/community.api';
import { useToastResult } from '@/hooks/useToastResult';
import {
  settingsFormSchema,
  type CommunitySettings,
  type SettingsForm,
} from '@/schemas/community.schema';
import { isCloudinaryUrl } from '@/utils/urls';

import { ImagePickerField } from '../common/ImagePickerField';
import { useImagePicker } from '../common/useImagePicker';

import { toAdminFormData } from './form-data';

import type { FC } from 'react';

const PREVIEW_HEIGHT = 180;
const DESCRIPTION_ROWS = 3;

interface HeaderSettingsFormProps {
  settings: CommunitySettings;
}

/** Title, description and background picture form (multipart PUT /api/community/settings). */
export const HeaderSettingsForm: FC<HeaderSettingsFormProps> = ({ settings }) => {
  const { t } = useTranslation();
  const update = useUpdateSettings();
  const toastResult = useToastResult();
  const image = useImagePicker(1);
  const { register, handleSubmit, formState } = useForm<SettingsForm>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { title: settings.title, description: settings.description },
  });

  const save = handleSubmit(async (values) => {
    const fields = { title: values.title.trim(), description: values.description.trim() };
    const data = toAdminFormData(fields, image.files[0]);
    if (await toastResult(update.mutateAsync(data), t('community.admin.headerSaved')))
      image.clear();
  });

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={(event) => void save(event)}>
      {isCloudinaryUrl(settings.headerImageUrl) && (
        <Box
          role="img"
          aria-label={t('community.admin.headerPreview')}
          sx={{
            height: PREVIEW_HEIGHT,
            borderRadius: 1,
            backgroundImage: `linear-gradient(90deg, rgba(8, 20, 38, 0.7), rgba(8, 20, 38, 0.28)), url("${settings.headerImageUrl}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      <TextField
        {...register('title')}
        label={t('community.admin.headerTitle')}
        error={formState.errors.title !== undefined}
        helperText={formState.errors.title?.message ? t(formState.errors.title.message) : undefined}
      />
      <TextField
        {...register('description')}
        label={t('community.admin.headerDescription')}
        multiline
        minRows={DESCRIPTION_ROWS}
      />
      <ImagePickerField
        picker={image}
        label={t('community.admin.uploadHeader')}
        disabled={update.isPending}
      />
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveIcon />}
        disabled={update.isPending}
        sx={{ alignSelf: 'flex-start', minHeight: 44 }}
      >
        {t('community.admin.saveHeader')}
      </Button>
    </Stack>
  );
};
