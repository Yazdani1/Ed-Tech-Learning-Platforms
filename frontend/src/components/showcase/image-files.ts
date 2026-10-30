import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGE_MB } from '@/schemas/showcase.schema';

const BYTES_PER_KB = 1024;

/** A problem with the picked files, as an i18n key plus its values. */
export interface FileProblem {
  key: string;
  values: Record<string, string | number>;
}

const isAllowedType = (type: string): boolean =>
  (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);

/**
 * Checks picked files before upload: PNG/JPEG/GIF/WEBP, at most 5 MB each, at most `maxFiles`.
 * (The backend checks the file content again; this only saves a useless upload.)
 */
export const findFileProblem = (files: File[], maxFiles: number): FileProblem | null => {
  if (files.length > maxFiles) return { key: 'showcase.file.tooMany', values: { max: maxFiles } };
  const badType = files.find((file) => !isAllowedType(file.type));
  if (badType) return { key: 'showcase.file.badType', values: { name: badType.name } };
  const tooLarge = files.find((file) => file.size > MAX_IMAGE_BYTES);
  if (tooLarge) {
    return { key: 'showcase.file.tooLarge', values: { name: tooLarge.name, max: MAX_IMAGE_MB } };
  }
  return null;
};

/** File size in whole KB, as the old page showed it. */
export const toKb = (bytes: number): number => Math.round(bytes / BYTES_PER_KB);

/** What the file inputs accept. */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(',');
