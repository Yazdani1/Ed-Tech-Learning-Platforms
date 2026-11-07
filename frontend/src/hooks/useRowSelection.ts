'use client';

import { useState } from 'react';

export interface RowSelection<T extends { _id: string }> {
  selected: T[];
  isSelected: (row: T) => boolean;
  toggle: (row: T) => void;
  /** Ticks every row of the page (or unticks them when all are ticked already) */
  togglePage: (rows: readonly T[]) => void;
  clear: () => void;
}

/** Ticked rows of a list, kept across pages and filters until cleared (CSV / PDF of the selection). */
export const useRowSelection = <T extends { _id: string }>(): RowSelection<T> => {
  const [selected, setSelected] = useState<Map<string, T>>(() => new Map());
  const update = (change: (next: Map<string, T>) => void): void => {
    setSelected((current) => {
      const next = new Map(current);
      change(next);
      return next;
    });
  };
  return {
    selected: [...selected.values()],
    isSelected: (row) => selected.has(row._id),
    toggle: (row) => {
      update((next) => {
        if (next.has(row._id)) next.delete(row._id);
        else next.set(row._id, row);
      });
    },
    togglePage: (rows) => {
      const allTicked = rows.length > 0 && rows.every((row) => selected.has(row._id));
      update((next) => {
        rows.forEach((row) => {
          if (allTicked) next.delete(row._id);
          else next.set(row._id, row);
        });
      });
    },
    clear: () => {
      setSelected(new Map());
    },
  };
};
