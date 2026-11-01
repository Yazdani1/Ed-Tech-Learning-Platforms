import { isCloudinaryUrl } from './urls';

// How people are shown everywhere (chat, group chat, Community Hub, posts): role colours, the letter of an
// avatar without a picture, and which pictures may be shown.

const ROLE_COLORS: Record<string, string> = {
  'Super Admin': '#f59e0b',
  Admin: '#ef4444',
  Moderator: '#10b981',
  Teacher: '#3b82f6',
  Student: '#8b5cf6',
};
const DEFAULT_ROLE_COLOR = '#6366f1';

/** The colour of a role (avatar background, role badge); `fallback` for an unknown role. */
export const roleColor = (role: string, fallback = DEFAULT_ROLE_COLOR): string =>
  ROLE_COLORS[role] ?? fallback;

/** First letter of a name for an avatar without a picture ("?" without a name). */
export const nameInitial = (name: string | null | undefined): string => {
  const first = name?.trim().charAt(0).toUpperCase();
  return first !== undefined && first !== '' ? first : '?';
};

/** Pictures from user data are shown only from Cloudinary (the CSP allows nothing else). */
export const cloudinaryImage = (src: string | null | undefined): string | undefined =>
  isCloudinaryUrl(src) ? src : undefined;
