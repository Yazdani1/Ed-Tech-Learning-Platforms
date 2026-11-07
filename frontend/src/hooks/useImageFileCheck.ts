'use client';

import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { IMAGE_MAX_MB, findImageProblem } from '@/utils/image-files';

interface ImageFileCheck {
  /** The file input's onChange: checks the picked file, then calls onFile */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Why the last picked file was refused (wrong type, too big) */
  problem: string | null;
}

/** One picked picture is checked (PNG / JPEG / GIF / WEBP, at most 5 MB) before it is used. */
export const useImageFileCheck = (onFile: (file: File) => void): ImageFileCheck => {
  const { t } = useTranslation();
  const [problem, setProblem] = useState<string | null>(null);
  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!file) return;
    const found = findImageProblem([file], 1);
    if (found?.reason === 'badType') setProblem(t('catalog.media.badType'));
    else if (found?.reason === 'tooLarge')
      setProblem(t('catalog.media.tooLarge', { max: IMAGE_MAX_MB }));
    else {
      setProblem(null);
      onFile(file);
    }
  };
  return { onChange, problem };
};
