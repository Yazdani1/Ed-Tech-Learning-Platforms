'use client';

import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useUploadCourseImage } from '@/api/course-extras.api';
import { PROJECT_MAX_IMAGES, type CourseImage } from '@/schemas/course-extras.schema';
import { IMAGE_MAX_MB, findImageProblem } from '@/utils/image-files';

export interface ScreenshotUpload {
  busy: boolean;
  /** Translated problem of the last pick or upload */
  error: string | null;
  /** The file input's change handler */
  onPick: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
}

/**
 * Checks picked screenshots (type, size, room left), then uploads them one by one; a failure keeps the
 * pictures uploaded before it. `onUploaded` gets the new pictures.
 */
export const useScreenshotUpload = (
  courseId: string,
  room: number,
  onUploaded: (images: CourseImage[]) => void,
): ScreenshotUpload => {
  const { t } = useTranslation();
  const upload = useUploadCourseImage(courseId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const problemText = (files: File[]): string | null => {
    const problem = findImageProblem(files, room);
    if (!problem) return null;
    if (problem.reason === 'tooMany')
      return t('catalog.extras.projects.tooManyImages', { max: PROJECT_MAX_IMAGES });
    if (problem.reason === 'badType') return t('catalog.media.badType');
    return t('catalog.media.tooLarge', { max: IMAGE_MAX_MB });
  };

  const onPick = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const problem = problemText(files);
    setError(problem);
    if (problem || files.length === 0) return;
    setBusy(true);
    const uploaded: CourseImage[] = [];
    for (const file of files) {
      const result = await upload.mutateAsync(file).catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : t('catalog.extras.uploadFailed'));
        return null;
      });
      if (!result) break;
      uploaded.push(result);
    }
    onUploaded(uploaded);
    setBusy(false);
  };

  return { busy, error, onPick };
};
