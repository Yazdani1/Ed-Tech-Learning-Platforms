'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCreateChannel, useUpdateChannel } from '@/api/group-chat.api';
import {
  channelFormSchema,
  type Channel,
  type ChannelFormValues,
} from '@/schemas/group-chat.schema';

import type { ApiError } from '@/services/http.service';

interface ChannelFormOptions {
  open: boolean;
  channel: Channel | undefined;
  onSaved: (channel: Channel) => void;
  onClose: () => void;
}

export interface ChannelForm {
  form: UseFormReturn<ChannelFormValues>;
  submit: () => void;
  error: ApiError | null;
  saving: boolean;
}

/** Create / edit channel form state: reset on open, create or update, toast, then close. */
export const useChannelForm = ({
  open,
  channel,
  onSaved,
  onClose,
}: ChannelFormOptions): ChannelForm => {
  const { t } = useTranslation();
  const create = useCreateChannel();
  const update = useUpdateChannel();
  const form = useForm<ChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: { name: '', description: '', type: 'Public' },
  });
  const { reset } = form;
  const { reset: resetCreate } = create;
  const { reset: resetUpdate } = update;

  useEffect(() => {
    if (!open) return;
    reset({
      name: channel?.name ?? '',
      description: channel?.description ?? '',
      type: channel?.type ?? 'Public',
    });
    resetCreate();
    resetUpdate();
  }, [open, channel, reset, resetCreate, resetUpdate]);

  const onValid = (values: ChannelFormValues): void => {
    const work = channel
      ? update.mutateAsync({ channelId: channel._id, values })
      : create.mutateAsync(values);
    work
      .then((saved) => {
        toast.success(t(channel ? 'groupChat.toast.updated' : 'groupChat.toast.created'));
        onSaved(saved);
        onClose();
      })
      // The error is shown in the dialog (error.message)
      .catch(() => undefined);
  };

  return {
    form,
    submit: () => void form.handleSubmit(onValid)(),
    error: channel ? update.error : create.error,
    saving: create.isPending || update.isPending,
  };
};
