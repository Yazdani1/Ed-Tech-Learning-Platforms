'use client';

import { useEffect, useMemo } from 'react';

/** A blob: address to preview a picked file; released when the file changes or the component unmounts. */
export const useImagePreview = (file: File | null): string | null => {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
};
