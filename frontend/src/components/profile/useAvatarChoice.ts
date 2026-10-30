'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AVATAR_ACCEPT, AVATAR_MAX_BYTES } from '@/schemas/profile.schema';

import type { AvatarChange } from './profileFormData';

export interface AvatarChoice {
  change: AvatarChange;
  /** What the avatar circle shows: the picked file, the current avatar, or nothing */
  preview: string | undefined;
  error: string | null;
  pick: (file: File | undefined) => void;
  remove: () => void;
}

interface Picked {
  file: File;
  url: string;
}

/** A new avatar picked in the form (type and size checked), or the current one removed. */
export const useAvatarChoice = (currentAvatar: string | undefined): AvatarChoice => {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The preview URL to free when it is replaced or the form closes
  const urlRef = useRef<string | null>(null);

  const replacePicked = (next: Picked | null): void => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next?.url ?? null;
    setPicked(next);
  };

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    },
    [],
  );

  const pick = (file: File | undefined): void => {
    if (!file) return;
    if (!AVATAR_ACCEPT.split(',').includes(file.type)) {
      setError(t('profile.avatarType'));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError(t('profile.avatarSize'));
      return;
    }
    setError(null);
    replacePicked({ file, url: URL.createObjectURL(file) });
    setRemoved(false);
  };

  const remove = (): void => {
    replacePicked(null);
    setRemoved(true);
    setError(null);
  };

  return {
    change: { file: picked?.file ?? null, remove: removed },
    preview: picked?.url ?? (removed ? undefined : currentAvatar),
    error,
    pick,
    remove,
  };
};
