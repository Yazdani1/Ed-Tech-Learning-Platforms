'use client';

import { useState } from 'react';

import type { Order } from '@/schemas/revenue.schema';

export interface OrderSelection {
  selected: Order[];
  isSelected: (order: Order) => boolean;
  toggle: (order: Order) => void;
  /** Ticks every order of the page (or unticks them when all are ticked already) */
  togglePage: (orders: readonly Order[]) => void;
  clear: () => void;
}

/** The ticked orders, kept across pages and filters until cleared (CSV / PDF of the selection). */
export const useOrderSelection = (): OrderSelection => {
  const [selected, setSelected] = useState<Map<string, Order>>(() => new Map());
  const update = (change: (next: Map<string, Order>) => void): void => {
    setSelected((current) => {
      const next = new Map(current);
      change(next);
      return next;
    });
  };
  return {
    selected: [...selected.values()],
    isSelected: (order) => selected.has(order._id),
    toggle: (order) => {
      update((next) => {
        if (next.has(order._id)) next.delete(order._id);
        else next.set(order._id, order);
      });
    },
    togglePage: (orders) => {
      const allTicked = orders.length > 0 && orders.every((order) => selected.has(order._id));
      update((next) => {
        orders.forEach((order) => {
          if (allTicked) next.delete(order._id);
          else next.set(order._id, order);
        });
      });
    },
    clear: () => {
      setSelected(new Map());
    },
  };
};
