const CLOUDINARY_HOST = 'res.cloudinary.com';

const parse = (value: string | null | undefined): URL | null => {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

/** Images next/image may load (next.config and the CSP allow only Cloudinary over https). */
export const isCloudinaryUrl = (value: string | null | undefined): value is string => {
  const url = parse(value);
  return url !== null && url.protocol === 'https:' && url.hostname === CLOUDINARY_HOST;
};

/** Links from user data are rendered only when they are plain http(s) addresses (no javascript: etc.). */
export const isSafeHttpUrl = (value: string | null | undefined): value is string => {
  const url = parse(value);
  return url !== null && (url.protocol === 'https:' || url.protocol === 'http:');
};
