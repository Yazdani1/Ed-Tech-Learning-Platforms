'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { findImageProblem, IMAGE_MAX_MB } from '@/utils/image-files';

export interface ImagePicker {
  files: File[];
  /** Translated reason the last pick was refused, or null */
  error: string | null;
  /** Adds picked files (replaces them when only one file is allowed) */
  add: (picked: File[]) => void;
  remove: (index: number) => void;
  clear: () => void;
}

/**
 * Picked image files for an upload: PNG/JPEG/GIF/WEBP, at most 5 MB each, at most `max` files.
 * (The backend checks the file content again; this only saves a useless upload.)
 */
export const useImagePicker = (max: number): ImagePicker => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const add = (picked: File[]): void => {
    const next = max === 1 ? picked.slice(0, 1) : [...files, ...picked];
    const problem = findImageProblem(picked) ?? findImageProblem(next, max);
    if (!problem) {
      setError(null);
      setFiles(next);
    } else if (problem.reason === 'tooMany') setError(t('community.images.tooMany', { max }));
    else {
      const values = { name: problem.file.name, max: IMAGE_MAX_MB };
      setError(t(`community.images.${problem.reason}`, values));
    }
  };

  return {
    files,
    error,
    add,
    remove: (index) => {
      setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    },
    clear: () => {
      setFiles([]);
      setError(null);
    },
  };
};
