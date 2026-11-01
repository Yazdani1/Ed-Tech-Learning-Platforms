'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Stack from '@mui/material/Stack';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useUpdatePost } from '@/api/community.api';
import { AppModal } from '@/components/common/AppModal';
import { useToastResult } from '@/hooks/useToastResult';
import {
  MAX_POST_IMAGES,
  postFormSchema,
  type CommunityChannel,
  type Post,
  type PostForm,
} from '@/schemas/community.schema';

import { ImagePickerField } from '../common/ImagePickerField';
import { useImagePicker } from '../common/useImagePicker';

import { PostFormFields } from './PostFormFields';
import { toPostFormData } from './post-form-data';

import type { FC } from 'react';

interface EditPostModalProps {
  post: Post;
  channels: CommunityChannel[];
  onClose: () => void;
}

/** Edit a discussion's channel, title, description and (optionally) replace its pictures. */
export const EditPostModal: FC<EditPostModalProps> = ({ post, channels, onClose }) => {
  const { t } = useTranslation();
  const update = useUpdatePost();
  const toastResult = useToastResult();
  const images = useImagePicker(MAX_POST_IMAGES);
  const { control, handleSubmit } = useForm<PostForm>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      channel: post.channel?._id ?? '',
      title: post.title,
      description: post.description,
    },
  });

  const save = handleSubmit(async (values) => {
    const data = toPostFormData(values, images.files);
    if (await toastResult(update.mutateAsync({ id: post._id, data }), t('community.post.updated')))
      onClose();
  });

  return (
    <AppModal
      open
      title={t('community.form.editTitle')}
      onClose={onClose}
      onSave={() => void save()}
      saveLabel={t('community.form.save')}
      saving={update.isPending}
      maxWidth="md"
    >
      <Stack spacing={2}>
        <PostFormFields
          control={control}
          channels={channels}
          placeholder={t('community.form.editPlaceholder')}
        />
        <ImagePickerField
          picker={images}
          multiple
          label={t('community.form.changeImages')}
          hint={t('community.form.replaceNote')}
          disabled={update.isPending}
        />
      </Stack>
    </AppModal>
  );
};
