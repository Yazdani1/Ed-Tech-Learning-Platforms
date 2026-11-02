'use client';

import { useDeleteConfirm } from '@/hooks/useConfirm';
import { useModal, type ModalState } from '@/hooks/useModal';

import { useSaveExtras } from './useSaveExtras';

type ListField = 'projects' | 'successStories' | 'faqs';

export interface ExtrasList<T> {
  /** The form (modal or drawer): data = index of the edited item, undefined to add */
  form: ModalState<number>;
  /** Adds (index undefined) or replaces an item and saves the whole list; closes the form on success */
  saveItem: (item: T, index: number | undefined) => void;
  /** Asks, then removes the item and saves the list */
  remove: (index: number, name: string) => Promise<void>;
  isSaving: boolean;
}

/** A section that is a list of items edited one by one (projects, success stories, FAQ). */
export const useExtrasList = <T>(
  courseId: string,
  field: ListField,
  items: readonly T[],
): ExtrasList<T> => {
  const form = useModal<number>();
  const { save, isSaving } = useSaveExtras(courseId);
  const confirmDelete = useDeleteConfirm();
  const saveList = (next: T[], onDone?: () => void): void => {
    save({ [field]: next }, onDone);
  };

  return {
    form,
    saveItem: (item, index) => {
      const next =
        index === undefined ? [...items, item] : items.map((old, i) => (i === index ? item : old));
      saveList(next, form.closeModal);
    },
    remove: async (index, name) => {
      if (!(await confirmDelete(name))) return;
      saveList(items.filter((_item, i) => i !== index));
    },
    isSaving,
  };
};
