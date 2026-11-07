'use client';

import Box from '@mui/material/Box';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePromos } from '@/api/promos.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { PAGE_SIZE } from '@/hooks/useClientPagination';

import { usePromoActions } from './usePromoActions';
import { usePromoColumns } from './usePromoColumns';

import type { Promo } from '@/schemas/promo.schema';
import type { FC } from 'react';

interface PromosTableProps {
  onEdit: (promo: Promo) => void;
  onHistory: (promo: Promo) => void;
}

/** The table has its own card: only a shadow is added */
const TABLE_SX = { '& .MuiTableContainer-root, & .MuiCard-root': { boxShadow: 2 } } as const;

/** Every promo, 10 per page, with its time left and row menu (edit, switch on / off, history, delete). */
export const PromosTable: FC<PromosTableProps> = ({ onEdit, onHistory }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const promos = usePromos(page, PAGE_SIZE);
  const columns = usePromoColumns({ ...usePromoActions(), onEdit, onHistory });
  const { data } = promos;
  return (
    <Box sx={TABLE_SX}>
      <ResponsiveDataView
        isLoading={promos.isPending}
        error={promos.error}
        onRetry={() => void promos.refetch()}
        emptyText={t('promos.empty')}
        rows={data?.items ?? []}
        columns={columns}
        getRowId={(row) => row._id}
        label={t('promos.title')}
        onRowClick={onEdit}
        pagination={
          data && { page: data.page, limit: data.limit, total: data.total, onPageChange: setPage }
        }
      />
    </Box>
  );
};
