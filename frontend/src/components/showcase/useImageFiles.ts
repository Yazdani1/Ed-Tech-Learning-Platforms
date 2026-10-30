'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { findFileProblem } from './image-files';

export interface ImageFiles {
  files: File[];
  /** Translated reason the last pick was refused, or null */
  error: string | null;
  pick: (picked: File[]) => void;
  clear: () => void;
}

/** Picked image files, checked (type, size, count) before they can be uploaded. */
export const useImageFiles = (maxFiles: number): ImageFiles => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pick = (picked: File[]): void => {
    const problem = findFileProblem(picked, maxFiles);
    setError(problem ? t(problem.key, problem.values) : null);
    setFiles(problem ? [] : picked);
  };

  const clear = (): void => {
    setFiles([]);
    setError(null);
  };

  return { files, error, pick, clear };
};
