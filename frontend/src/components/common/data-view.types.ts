import type { ReactNode } from 'react';

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Right-aligned (numbers, the actions column) */
  align?: 'left' | 'right' | 'center';
  /** Left out of the mobile card (e.g. secondary details) */
  hideOnMobile?: boolean;
  width?: number | string;
}

/** What the table (desktop) and the cards (phone) both get. */
export interface DataViewBodyProps<T> {
  rows: T[];
  columns: DataColumn<T>[];
  getRowId: (row: T) => string;
  /** Accessible list/table name */
  label: string;
  onRowClick?: (row: T) => void;
}
