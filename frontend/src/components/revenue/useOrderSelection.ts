'use client';

import { useRowSelection, type RowSelection } from '@/hooks/useRowSelection';

import type { Order } from '@/schemas/revenue.schema';

export type OrderSelection = RowSelection<Order>;

/** The ticked orders, kept across pages and filters until cleared (CSV / PDF of the selection). */
export const useOrderSelection = (): OrderSelection => useRowSelection<Order>();
