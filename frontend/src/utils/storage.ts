// Small per-browser preferences only (language, sidebar state). Never tokens or personal data.
// Every access is guarded: storage can be blocked (private mode, strict settings) or missing (server).

export const readPreference = (key: string): string | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writePreference = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the preference simply is not remembered
  }
};
