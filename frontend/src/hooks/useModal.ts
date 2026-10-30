'use client';

import { useCallback, useState } from 'react';

export interface ModalState<T> {
  open: boolean;
  /** What the modal works on (e.g. the row being edited); undefined for "create" */
  data: T | undefined;
  openModal: (data?: T) => void;
  closeModal: () => void;
}

/** Open/close state for one AppModal, with the item it is about. */
export const useModal = <T = undefined>(): ModalState<T> => {
  const [state, setState] = useState<{ open: boolean; data: T | undefined }>({
    open: false,
    data: undefined,
  });
  const openModal = useCallback((data?: T) => {
    setState({ open: true, data });
  }, []);
  const closeModal = useCallback(() => {
    setState((current) => ({ ...current, open: false }));
  }, []);
  return { open: state.open, data: state.data, openModal, closeModal };
};
