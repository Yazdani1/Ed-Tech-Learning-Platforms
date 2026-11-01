'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useImagePreview } from '@/hooks/useImagePreview';
import { IMAGE_MAX_BYTES, IMAGE_MAX_MB, isAllowedImageType } from '@/utils/image-files';

export interface CoverImage {
  /** The picked file not uploaded yet */
  file: File | null;
  /** blob: address of the picked file, for the preview */
  preview: string | null;
  /** Translated reason the last pick was refused */
  error: string | null;
  /** Checks type and size; returns true when the file was accepted */
  pick: (file: File) => boolean;
  clear: () => void;
  /** Hands the file to a save and forgets it (so it is uploaded once) */
  take: () => File | null;
  /** Puts a taken file back after a failed save (unless another one was picked meanwhile) */
  restore: (file: File) => void;
  /** After a successful save: the preview switches to the uploaded cover (unless a new file was picked) */
  uploaded: () => void;
}

/** The course cover picked in the Media tab, checked before it is uploaded with the next save. */
export const useCoverImage = (): CoverImage => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const preview = useImagePreview(file);

  const set = useCallback((next: File | null) => {
    fileRef.current = next;
    setFile(next);
  }, []);

  const pick = useCallback(
    (picked: File): boolean => {
      if (!isAllowedImageType(picked.type)) {
        setError(t('catalog.media.badType'));
        return false;
      }
      if (picked.size > IMAGE_MAX_BYTES) {
        setError(t('catalog.media.tooLarge', { max: IMAGE_MAX_MB }));
        return false;
      }
      setError(null);
      set(picked);
      return true;
    },
    [set, t],
  );

  const clear = useCallback(() => {
    setError(null);
    set(null);
  }, [set]);

  const take = useCallback((): File | null => {
    const current = fileRef.current;
    fileRef.current = null;
    return current;
  }, []);

  const restore = useCallback((taken: File) => {
    fileRef.current ??= taken;
  }, []);

  const uploaded = useCallback(() => {
    if (!fileRef.current) setFile(null);
  }, []);

  return { file, preview, error, pick, clear, take, restore, uploaded };
};
