import type { KeyboardEvent } from 'react';

/** Props that make a clickable row/card reachable and usable from the keyboard (Tab, Enter, Space). */
export interface RowActivationProps {
  tabIndex?: number;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

export const rowActivationProps = (onActivate: (() => void) | undefined): RowActivationProps => {
  if (!onActivate) return {};
  return {
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (event) => {
      // Keys pressed on a button or link inside the row belong to that control
      if (event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onActivate();
      }
    },
  };
};
