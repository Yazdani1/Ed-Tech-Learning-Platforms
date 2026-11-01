'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCreateReply } from '@/api/community.api';
import { RichTextField } from '@/components/common/rich-text/RichTextField';
import { useToastResult } from '@/hooks/useToastResult';
import {
  MAX_POST_IMAGES,
  replyFormSchema,
  type ReplyForm as ReplyFormValues,
} from '@/schemas/community.schema';

import { FormButtons } from '../common/FormButtons';
import { ImagePickerField } from '../common/ImagePickerField';
import { useImagePicker } from '../common/useImagePicker';

import type { FC } from 'react';

const EDITOR_MIN_HEIGHT = 140;

interface ReplyFormProps {
  postId: string;
  onDone: () => void;
}

/** Answer a discussion: rich text and up to eight pictures. */
export const ReplyForm: FC<ReplyFormProps> = ({ postId, onDone }) => {
  const { t } = useTranslation();
  const create = useCreateReply();
  const toastResult = useToastResult();
  const images = useImagePicker(MAX_POST_IMAGES);
  const { control, handleSubmit } = useForm<ReplyFormValues>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: { body: '' },
  });

  const submit = handleSubmit(async ({ body }) => {
    const data = new FormData();
    data.append('body', body);
    images.files.forEach((image) => {
      data.append('images', image);
    });
    if (await toastResult(create.mutateAsync({ id: postId, data }), t('community.reply.added')))
      onDone();
  });

  return (
    <Stack
      component="form"
      noValidate
      spacing={1.5}
      onSubmit={(event) => void submit(event)}
      sx={{ width: '100%' }}
    >
      <RichTextField
        control={control}
        name="body"
        label={t('community.reply.editorLabel')}
        placeholder={t('community.reply.placeholder')}
        minHeight={EDITOR_MIN_HEIGHT}
        showLabel={false}
      />
      <ImagePickerField
        picker={images}
        multiple
        label={t('community.images.upload')}
        disabled={create.isPending}
      />
      <FormButtons
        submitLabel={t('community.reply.publish')}
        onCancel={onDone}
        busy={create.isPending}
        startIcon={<SendIcon />}
      />
    </Stack>
  );
};
