'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useSendBroadcast } from '@/api/announcements.api';
import { broadcastFormSchema, type BroadcastForm } from '@/schemas/announcement-broadcast.schema';
import { hasVisibleText } from '@/utils/html-text';

import type { ApiError } from '@/services/http.service';

export interface BroadcastFormState {
  form: UseFormReturn<BroadcastForm>;
  image: File | null;
  setImage: (file: File) => void;
  submit: () => void;
  sending: boolean;
  error: ApiError | null;
}

const EMPTY: BroadcastForm = { title: '', description: '', courseIds: [] };

/**
 * The send form (the dialog is mounted only while open, so it always starts empty): title, rich text, the
 * courses and an optional picture.
 */
export const useBroadcastForm = (onDone: () => void): BroadcastFormState => {
  const { t } = useTranslation();
  const send = useSendBroadcast();
  const [image, setImage] = useState<File | null>(null);
  const form = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastFormSchema),
    defaultValues: EMPTY,
  });

  const submit = form.handleSubmit((values) => {
    if (!hasVisibleText(values.description)) {
      form.setError('description', { message: 'validation.required' });
      return;
    }
    send.mutate(
      {
        title: values.title.trim(),
        description: values.description,
        courseIds: values.courseIds,
        image,
      },
      {
        onSuccess: () => {
          toast.success(t('announcements.sent', { count: values.courseIds.length }));
          onDone();
        },
      },
    );
  });

  return {
    form,
    image,
    setImage,
    submit: () => void submit(),
    sending: send.isPending,
    error: send.error,
  };
};
