'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useImagePreview } from '@/hooks/useImagePreview';
import { IMAGE_MAX_BYTES, isAllowedImageType } from '@/utils/image-files';

import type { ChangeEvent } from 'react';

export interface TeacherImageChoice {
  /** Why the last picked file was refused ('' when accepted) */
  error: string;
  /** Object URL of the picked file for the preview */
  previewUrl: string | null;
  handleSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Photo choice: checks type and size before accepting a file (the server checks the bytes again) and
 * gives a preview URL that is released when it is no longer shown.
 */
export const useTeacherImageChoice = (
  file: File | null,
  onChange: (file: File) => void,
): TeacherImageChoice => {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const previewUrl = useImagePreview(file);

  const handleSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    if (!isAllowedImageType(selected.type)) {
      setError(t('people.teachers.imageType'));
      return;
    }
    if (selected.size > IMAGE_MAX_BYTES) {
      setError(t('people.teachers.imageSize'));
      return;
    }
    setError('');
    onChange(selected);
  };

  return { error, previewUrl, handleSelect };
};
