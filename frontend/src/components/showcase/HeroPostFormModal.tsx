'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateHeroPost, useUploadHeroPosts } from '@/api/showcase.api';
import { AppModal } from '@/components/common/AppModal';
import {
  MAX_HERO_FILES,
  heroPostFormSchema,
  type HeroPost,
  type HeroPostForm,
} from '@/schemas/showcase.schema';

import { heroFormData, heroFormValues } from './hero-form';
import { HeroFilePicker } from './HeroFilePicker';
import { HeroPostFormFields } from './HeroPostFormFields';
import { useImageFiles } from './useImageFiles';

import type { FC } from 'react';

interface HeroPostFormModalProps {
  open: boolean;
  /** The post being edited; undefined to upload new images */
  post: HeroPost | undefined;
  postCount: number;
  onClose: () => void;
}

/** Upload one or more slider images, or edit one (replacement image, visibility, schedule, position). */
export const HeroPostFormModal: FC<HeroPostFormModalProps> = ({
  open,
  post,
  postCount,
  onClose,
}) => {
  const { t } = useTranslation();
  const upload = useUploadHeroPosts();
  const update = useUpdateHeroPost();
  const isEdit = post !== undefined;
  const mutation = isEdit ? update : upload;
  const picked = useImageFiles(isEdit ? 1 : MAX_HERO_FILES);
  const form = useForm<HeroPostForm>({
    resolver: zodResolver(heroPostFormSchema),
    defaultValues: heroFormValues(undefined, 0),
  });
  const [reset, resetUpload, resetUpdate] = [form.reset, upload.reset, update.reset];

  useEffect(() => {
    if (!open) return;
    reset(heroFormValues(post, postCount));
    resetUpload();
    resetUpdate();
  }, [open, post, postCount, reset, resetUpload, resetUpdate]);

  const handleClose = (): void => {
    picked.clear();
    onClose();
  };

  const onSave = form.handleSubmit((values) => {
    const data = heroFormData(values, picked.files, isEdit);
    const onSuccess = (): void => {
      toast.success(t(isEdit ? 'showcase.posts.updated' : 'showcase.posts.uploaded'));
      handleClose();
    };
    if (post) update.mutate({ id: post._id, data }, { onSuccess });
    else upload.mutate(data, { onSuccess });
  });

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={t(isEdit ? 'showcase.form.editTitle' : 'showcase.form.createTitle')}
      onSave={() => void onSave()}
      saveLabel={t(isEdit ? 'showcase.form.update' : 'showcase.form.upload')}
      saving={mutation.isPending}
      saveDisabled={!isEdit && picked.files.length === 0}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {mutation.error && <Alert severity="error">{mutation.error.message}</Alert>}
        <HeroFilePicker
          multiple={!isEdit}
          files={picked.files}
          error={picked.error}
          onFiles={picked.pick}
        />
        <HeroPostFormFields form={form} />
      </Stack>
    </AppModal>
  );
};
