'use client';

import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ListPaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** "Showing 11-20 of 57" and page buttons under every list; hidden when everything fits on one page. */
export const ListPagination: FC<ListPaginationProps> = ({ page, limit, total, onPageChange }) => {
  const { t } = useTranslation();
  const pageCount = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  if (total === 0) return null;
  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: { xs: 'center', sm: 'space-between' },
        gap: 1.5,
        mt: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t('common.showingRange', { from, to, total })}
      </Typography>
      {pageCount > 1 && (
        <Pagination
          page={Math.min(page, pageCount)}
          count={pageCount}
          onChange={(_event, next) => {
            onPageChange(next);
          }}
          shape="rounded"
          color="primary"
          siblingCount={0}
          getItemAriaLabel={(type, itemPage) =>
            type === 'page'
              ? t('common.goToPage', { page: itemPage })
              : t(`common.pagination.${type}`)
          }
          sx={{ '& .MuiPaginationItem-root': { minWidth: 44, height: 44 } }}
        />
      )}
    </Box>
  );
};
