import { findImageProblem, IMAGE_MAX_MB } from '@/utils/image-files';

const BYTES_PER_KB = 1024;

/** A problem with the picked files, as an i18n key plus its values. */
export interface FileProblem {
  key: string;
  values: Record<string, string | number>;
}

/**
 * Checks picked files before upload: PNG/JPEG/GIF/WEBP, at most 5 MB each, at most `maxFiles`.
 * (The backend checks the file content again; this only saves a useless upload.)
 */
export const findFileProblem = (files: File[], maxFiles: number): FileProblem | null => {
  const problem = findImageProblem(files, maxFiles);
  if (!problem) return null;
  if (problem.reason === 'tooMany') {
    return { key: 'showcase.file.tooMany', values: { max: maxFiles } };
  }
  return {
    key: `showcase.file.${problem.reason}`,
    values: { name: problem.file.name, max: IMAGE_MAX_MB },
  };
};

/** File size in whole KB, as the old page showed it. */
export const toKb = (bytes: number): number => Math.round(bytes / BYTES_PER_KB);
