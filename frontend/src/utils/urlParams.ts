export const encodeParam = (value: string): string => {
  if (!value) return '';
  return btoa(encodeURIComponent(value));
};

export const decodeParam = (value: string): string => {
  if (!value) return '';
  try {
    return decodeURIComponent(atob(value));
  } catch {
    return value; // graceful fallback for manually typed URLs
  }
};
