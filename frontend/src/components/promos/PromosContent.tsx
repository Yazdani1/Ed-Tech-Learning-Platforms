'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeletePromo, usePromos, useSavePromo } from '@/api/promos.api';
import { PageHeader } from '@/components/common/PageHeader';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { PAGE_SIZE } from '@/hooks/useClientPagination';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { useModal } from '@/hooks/useModal';

import { PromoFormModal } from './PromoFormModal';
import { usePromoColumns } from './usePromoColumns';

import type { Promo } from '@/schemas/promo.schema';

/** Stop / start a promo and delete it (asks first; the server refuses a used one with a message). */
const usePromoActions = () => {
  const { t } = useTranslation();
  const save = useSavePromo();
  const remove = useDeletePromo();
  const confirmDelete = useDeleteConfirm();
  return {
    onToggle: (promo: Promo): void => {
      save.mutate(
        { id: promo._id, body: { isActive: !promo.isActive } },
        {
          onSuccess: () => toast.success(t(promo.isActive ? 'promos.stopped' : 'promos.resumed')),
          onError: (error) => toast.error(error.message),
        },
      );
    },
    onDelete: (promo: Promo): void => {
      void confirmDelete(promo.title).then((ok) => {
        if (!ok) return;
        remove.mutate(promo._id, {
          onSuccess: () => toast.success(t('promos.deleted')),
          onError: (error) => toast.error(error.message),
        });
      });
    },
  };
};

/** The Promos page body: header, the paged list, the form (inside the role check of PromosPage). */
export const PromosContent = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const promos = usePromos(page, PAGE_SIZE);
  const modal = useModal<Promo>();
  const columns = usePromoColumns({ ...usePromoActions(), onEdit: modal.openModal });
  const { data } = promos;

  return (
    <Box>
      <PageHeader
        title={t('promos.title')}
        subtitle={t('promos.subtitle')}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              modal.openModal();
            }}
            sx={{ minHeight: 44 }}
          >
            {t('promos.add')}
          </Button>
        }
      />
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <ResponsiveDataView
          isLoading={promos.isPending}
          error={promos.error}
          onRetry={() => void promos.refetch()}
          emptyText={t('promos.empty')}
          rows={data?.items ?? []}
          columns={columns}
          getRowId={(row) => row._id}
          label={t('promos.title')}
          onRowClick={modal.openModal}
          pagination={
            data && { page: data.page, limit: data.limit, total: data.total, onPageChange: setPage }
          }
        />
      </Paper>
      <PromoFormModal open={modal.open} promo={modal.data} onClose={modal.closeModal} />
    </Box>
  );
};
