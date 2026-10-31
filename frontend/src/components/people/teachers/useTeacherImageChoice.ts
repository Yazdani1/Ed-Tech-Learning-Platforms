'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TEACHER_IMAGE_MAX_BYTES, TEACHER_IMAGE_TYPES } from './teacher-utils';

import type { ChangeEvent } from 'react';

export interface TeacherImageChoice {
  /** Why the last picked file was refused ('' when accepted) */
  error: string;
  /** Object URL of the picked file for the preview */
  previewUrl: string | null;
  handleSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}

const isAllowedType = (type: string): boolean =>
  (TEACHER_IMAGE_TYPES as readonly string[]).includes(type);

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
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const handleSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    if (!isAllowedType(selected.type)) {
      setError(t('people.teachers.imageType'));
      return;
    }
    if (selected.size > TEACHER_IMAGE_MAX_BYTES) {
      setError(t('people.teachers.imageSize'));
      return;
    }
    setError('');
    onChange(selected);
  };

  return { error, previewUrl, handleSelect };
};
