'use client';

import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';

export interface WidgetFocus {
  panelRef: RefObject<HTMLDivElement | null>;
  buttonRef: RefObject<HTMLButtonElement | null>;
  /** onKeyDown of the panel: Escape closes it */
  closeOnEscape: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Focus of the floating chat: opening moves the focus into the panel, closing gives it back to the round
 * button (only after it was opened, never on the first render).
 */
export const useWidgetFocus = (open: boolean, close: () => void): WidgetFocus => {
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpened = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpened.current = true;
      panelRef.current?.focus();
    } else if (wasOpened.current) {
      buttonRef.current?.focus();
    }
  }, [open]);

  const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    close();
  };

  return { panelRef, buttonRef, closeOnEscape };
};
