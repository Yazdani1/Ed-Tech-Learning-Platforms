'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateProfile } from '@/api/profile.api';
import {
  makeProfileFormSchema,
  type Profile,
  type ProfileFormValues,
} from '@/schemas/profile.schema';

import { buildProfileFormData, profileFormDefaults } from './profileFormData';
import { useAvatarChoice, type AvatarChoice } from './useAvatarChoice';

export interface ProfileFormState {
  form: UseFormReturn<ProfileFormValues>;
  /** Server or "nothing changed" message shown above the fields */
  formError: string | null;
  avatar: AvatarChoice;
  onSubmit: () => void;
  isSaving: boolean;
}

/** Edit-profile form: field rules, avatar pick/remove with preview, and the multipart save. */
export const useProfileForm = (profile: Profile, onSaved: () => void): ProfileFormState => {
  const { t } = useTranslation();
  const mutation = useUpdateProfile();
  const schema = useMemo(
    () => makeProfileFormSchema(profile.email, profile.role === 'Student'),
    [profile.email, profile.role],
  );
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: profileFormDefaults(profile),
  });
  const avatar = useAvatarChoice(profile.avatar);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);
    const body = buildProfileFormData(profile, values, avatar.change);
    if (!body) {
      setFormError(t('profile.noChanges'));
      return;
    }
    mutation.mutate(body, {
      onSuccess: () => {
        toast.success(t('profile.updated'));
        onSaved();
      },
      onError: (error) => {
        setFormError(error.message);
      },
    });
  });

  return {
    form,
    formError,
    avatar,
    onSubmit: () => void onSubmit(),
    isSaving: mutation.isPending,
  };
};
