'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import usePagination from '@mui/material/usePagination';
import { useTranslation } from 'react-i18next';

import { PaginationItem } from './PaginationItem';

import type { FC } from 'react';

interface ListPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

const NAV_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: { xs: 'center', sm: 'space-between' },
  gap: 1.5,
  mt: 2.5,
} as const;
const LIST_SX = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  listStyle: 'none',
  m: 0,
  p: 0.5,
  borderRadius: '16px',
  bgcolor: 'background.paper',
  border: 1,
  borderColor: 'divider',
} as const;

/**
 * The project's pagination: "Showing 11-20 of 57" and the page buttons (previous, numbers with gaps, next).
 * Shown only when the list has more than one page.
 */
export const ListPagination: FC<ListPaginationProps> = ({ page, limit, total, onPageChange }) => {
  const { t } = useTranslation();
  const pageCount = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  const current = Math.min(Math.max(page, 1), pageCount);
  const { items } = usePagination({
    count: pageCount,
    page: current,
    siblingCount: 0,
    onChange: (_event, next) => {
      onPageChange(next);
    },
  });
  if (pageCount <= 1) return null;
  const from = (current - 1) * limit + 1;
  const to = Math.min(current * limit, total);

  return (
    <Box component="nav" aria-label={t('common.pagination.label')} sx={NAV_SX}>
      <Typography variant="body2" color="text.secondary">
        {t('common.showingRange', { from, to, total })}
      </Typography>
      <Box component="ul" sx={LIST_SX}>
        {items.map((item, index) => (
          <PaginationItem key={`${item.type}-${String(item.page)}-${String(index)}`} item={item} />
        ))}
      </Box>
    </Box>
  );
};
