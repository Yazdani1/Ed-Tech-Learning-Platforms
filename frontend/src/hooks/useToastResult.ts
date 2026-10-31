'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { toastError } from '@/utils/toast-error';

export type ToastResult = (work: Promise<unknown>, success?: string) => Promise<boolean>;

/**
 * Waits for a mutation (`mutateAsync(...)`) and shows a success toast or the error's message.
 * Resolves true on success (e.g. to close the form), false on failure.
 */
export const useToastResult = (): ToastResult =>
  useCallback(
    (work, success) =>
      work
        .then(() => {
          if (success) toast.success(success);
          return true;
        })
        .catch(toastError),
    [],
  );
