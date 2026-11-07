'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateBroadcast } from '@/api/announcements.api';
import {
  broadcastFormSchema,
  type BroadcastDetails,
  type BroadcastForm,
} from '@/schemas/announcement-broadcast.schema';
import { hasVisibleText } from '@/utils/html-text';

import type { ApiError } from '@/services/http.service';

export interface BroadcastEditState {
  form: UseFormReturn<BroadcastForm>;
  image: File | null;
  setImage: (file: File) => void;
  /** The saved picture still shown (null once removed) */
  currentImage: string | null;
  removeImage: () => void;
  submit: () => void;
  saving: boolean;
  error: ApiError | null;
}

/** The edit form of a sent announcement: title, text and picture (the courses stay as they are). */
export const useBroadcastEditForm = (
  item: BroadcastDetails,
  onDone: () => void,
): BroadcastEditState => {
  const { t } = useTranslation();
  const update = useUpdateBroadcast();
  const [image, setImage] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const form = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: {
      title: item.title,
      description: item.description,
      courseIds: item.courses.map((course) => course._id),
    },
  });

  const submit = form.handleSubmit((values) => {
    if (!hasVisibleText(values.description)) {
      form.setError('description', { message: 'validation.required' });
      return;
    }
    update.mutate(
      {
        id: item._id,
        title: values.title.trim(),
        description: values.description,
        image,
        removeImage: removed,
      },
      {
        onSuccess: () => {
          toast.success(t('announcements.edit.saved'));
          onDone();
        },
      },
    );
  });

  return {
    form,
    image,
    setImage: (file) => {
      setImage(file);
      setRemoved(false);
    },
    currentImage: removed ? null : (item.image?.url ?? null),
    removeImage: () => {
      setImage(null);
      setRemoved(true);
    },
    submit: () => void submit(),
    saving: update.isPending,
    error: update.error,
  };
};
