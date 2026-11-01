// Image uploads everywhere (avatars, teacher photos, course covers, homepage posts, Community Hub, group
// chat): the backend's `upload` middleware takes PNG/JPEG/GIF/WEBP up to 5 MB and checks the real bytes.
// These checks only save a useless upload; the server decides.

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
/** For the `accept` attribute of image file inputs. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');
export const BYTES_PER_MB = 1024 * 1024;
export const IMAGE_MAX_MB = 5;
export const IMAGE_MAX_BYTES = IMAGE_MAX_MB * BYTES_PER_MB;

export const isAllowedImageType = (type: string): boolean =>
  (IMAGE_TYPES as readonly string[]).includes(type);

/** Why picked images cannot be uploaded (the first problem found). */
export type ImageProblem = { reason: 'badType' | 'tooLarge'; file: File } | { reason: 'tooMany' };

/** Checks type, size and (when given) the number of files. */
export const findImageProblem = (
  files: readonly File[],
  maxFiles = Number.POSITIVE_INFINITY,
): ImageProblem | null => {
  const badType = files.find((file) => !isAllowedImageType(file.type));
  if (badType) return { reason: 'badType', file: badType };
  const tooLarge = files.find((file) => file.size > IMAGE_MAX_BYTES);
  if (tooLarge) return { reason: 'tooLarge', file: tooLarge };
  return files.length > maxFiles ? { reason: 'tooMany' } : null;
};
