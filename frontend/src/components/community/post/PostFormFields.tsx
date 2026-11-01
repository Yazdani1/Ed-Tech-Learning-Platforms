'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { RichTextField } from '@/components/common/rich-text/RichTextField';

import type { CommunityChannel, PostForm } from '@/schemas/community.schema';
import type { FC } from 'react';

const EDITOR_MIN_HEIGHT = 180;

interface PostFormFieldsProps {
  control: Control<PostForm>;
  channels: CommunityChannel[];
  placeholder: string;
}

/** Channel, title and the rich text description of a discussion (create and edit). */
export const PostFormFields: FC<PostFormFieldsProps> = ({ control, channels, placeholder }) => {
  const { t } = useTranslation();
  return (
    <>
      <Controller
        control={control}
        name="channel"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            select
            fullWidth
            label={t('community.form.channel')}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message ? t(fieldState.error.message) : undefined}
          >
            {channels.map((channel) => (
              <MenuItem key={channel._id} value={channel._id}>
                {channel.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            fullWidth
            label={t('community.form.title')}
            error={fieldState.error !== undefined}
            helperText={fieldState.error?.message ? t(fieldState.error.message) : undefined}
          />
        )}
      />
      <RichTextField
        control={control}
        name="description"
        label={t('community.form.description')}
        placeholder={placeholder}
        minHeight={EDITOR_MIN_HEIGHT}
      />
    </>
  );
};
