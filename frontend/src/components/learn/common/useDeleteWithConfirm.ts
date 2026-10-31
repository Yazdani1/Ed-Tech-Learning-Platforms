'use client';

import toast from 'react-hot-toast';

import { useDeleteConfirm } from '@/hooks/useConfirm';

import type { UseMutationResult } from '@tanstack/react-query';

/** "Delete <name>?" confirmation, then the delete mutation with a success or error toast (and onDeleted). */
export const useDeleteWithConfirm = <V>(
  mutation: UseMutationResult<void, Error, V>,
  successMessage: string,
): ((name: string, variables: V, onDeleted?: () => void) => void) => {
  const confirmDelete = useDeleteConfirm();
  const remove = async (name: string, variables: V, onDeleted?: () => void): Promise<void> => {
    if (!(await confirmDelete(name))) return;
    await mutation
      .mutateAsync(variables)
      .then(() => {
        toast.success(successMessage);
        onDeleted?.();
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : String(error));
      });
  };
  return (name, variables, onDeleted) => void remove(name, variables, onDeleted);
};
