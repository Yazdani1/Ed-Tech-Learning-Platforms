'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCreatePost } from '@/api/community.api';
import { useToastResult } from '@/hooks/useToastResult';
import {
  MAX_POST_IMAGES,
  postFormSchema,
  type CommunityChannel,
  type PostForm,
} from '@/schemas/community.schema';

import { FormButtons } from '../common/FormButtons';
import { ImagePickerField } from '../common/ImagePickerField';
import { useImagePicker } from '../common/useImagePicker';
import { PostFormFields } from '../post/PostFormFields';
import { toPostFormData } from '../post/post-form-data';

import type { FC } from 'react';

interface CreatePostFormProps {
  channels: CommunityChannel[];
  onClose: () => void;
}

/** "Start a discussion": channel, title, rich text description and up to eight pictures. */
export const CreatePostForm: FC<CreatePostFormProps> = ({ channels, onClose }) => {
  const { t } = useTranslation();
  const create = useCreatePost();
  const toastResult = useToastResult();
  const images = useImagePicker(MAX_POST_IMAGES);
  const { control, handleSubmit } = useForm<PostForm>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { channel: '', title: '', description: '' },
  });

  const submit = handleSubmit(async (values) => {
    if (
      await toastResult(
        create.mutateAsync(toPostFormData(values, images.files)),
        t('community.post.created'),
      )
    )
      onClose();
  });

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: 1, borderColor: 'divider' }}>
      <Stack
        component="form"
        noValidate
        spacing={2}
        aria-label={t('community.form.startTitle')}
        onSubmit={(event) => void submit(event)}
      >
        <Typography variant="h6" component="h3" sx={{ fontWeight: 900 }}>
          {t('community.form.startTitle')}
        </Typography>
        <PostFormFields
          control={control}
          channels={channels}
          placeholder={t('community.form.descriptionPlaceholder')}
        />
        <ImagePickerField
          picker={images}
          multiple
          label={t('community.images.upload')}
          disabled={create.isPending}
        />
        <FormButtons
          submitLabel={t('community.form.publish')}
          onCancel={onClose}
          busy={create.isPending}
        />
      </Stack>
    </Paper>
  );
};
