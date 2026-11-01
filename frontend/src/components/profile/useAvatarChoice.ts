'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useImagePreview } from '@/hooks/useImagePreview';
import { IMAGE_MAX_BYTES, isAllowedImageType } from '@/utils/image-files';

import type { AvatarChange } from './profileFormData';

export interface AvatarChoice {
  change: AvatarChange;
  /** What the avatar circle shows: the picked file, the current avatar, or nothing */
  preview: string | undefined;
  error: string | null;
  pick: (file: File | undefined) => void;
  remove: () => void;
}

/** A new avatar picked in the form (type and size checked), or the current one removed. */
export const useAvatarChoice = (currentAvatar: string | undefined): AvatarChoice => {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<File | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickedUrl = useImagePreview(picked);

  const pick = (file: File | undefined): void => {
    if (!file) return;
    if (!isAllowedImageType(file.type)) {
      setError(t('profile.avatarType'));
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError(t('profile.avatarSize'));
      return;
    }
    setError(null);
    setPicked(file);
    setRemoved(false);
  };

  const remove = (): void => {
    setPicked(null);
    setRemoved(true);
    setError(null);
  };

  return {
    change: { file: picked, remove: removed },
    preview: pickedUrl ?? (removed ? undefined : currentAvatar),
    error,
    pick,
    remove,
  };
};
