'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { ImagePickField } from '@/components/common/ImagePickField';
import { RichTextField } from '@/components/common/rich-text/RichTextField';
import { useFieldError } from '@/hooks/useFieldError';
import { useImagePreview } from '@/hooks/useImagePreview';

import type { BroadcastFormState } from './useBroadcastForm';
import type { FC } from 'react';

interface BroadcastFieldsProps {
  state: BroadcastFormState;
}

const IMAGE_PREVIEW = 120;
const EDITOR_HEIGHT = 180;

/** Right column of the send dialog: title, the text (rich text editor) and an optional picture. */
export const BroadcastFields: FC<BroadcastFieldsProps> = ({ state }) => {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const preview = useImagePreview(state.image);
  const { register, control, formState } = state.form;
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <TextField
        {...register('title')}
        label={t('announcements.fields.title')}
        required
        fullWidth
        {...fieldError(formState.errors.title)}
      />
      <RichTextField
        control={control}
        name="description"
        label={t('announcements.fields.description')}
        minHeight={EDITOR_HEIGHT}
      />
      <ImagePickField
        label={t('announcements.fields.image')}
        previewUrl={preview}
        onFile={state.setImage}
        size={IMAGE_PREVIEW}
      />
    </Stack>
  );
};
