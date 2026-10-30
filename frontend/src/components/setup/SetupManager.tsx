'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTranslation } from 'react-i18next';

import { useSetupItems } from '@/api/setup.api';
import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { useModal } from '@/hooks/useModal';

import { SetupItemFormModal } from './SetupItemFormModal';
import { SetupManagerHeader } from './SetupManagerHeader';
import { useSetupColumns } from './useSetupColumns';

import type { SetupItem, SetupKind } from '@/schemas/setup.schema';
import type { FC } from 'react';

interface SetupManagerProps {
  kind: SetupKind;
}

/** One list (categories or course types): header with count and Add button, the list, the form. */
export const SetupManager: FC<SetupManagerProps> = ({ kind }) => {
  const { t } = useTranslation();
  const query = useSetupItems(kind);
  const modal = useModal<SetupItem>();
  const items = query.data ?? [];
  const columns = useSetupColumns(kind, modal.openModal);

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <SetupManagerHeader
        kind={kind}
        count={query.data?.length}
        onAdd={() => {
          modal.openModal();
        }}
      />
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <ResponsiveDataView
          isLoading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
          emptyText={t(`showcase.setup.${kind}.empty`)}
          rows={items}
          columns={columns}
          getRowId={(item) => item._id}
          label={t(`showcase.setup.${kind}.plural`)}
        />
      </Box>
      <SetupItemFormModal
        kind={kind}
        open={modal.open}
        item={modal.data}
        onClose={modal.closeModal}
      />
    </Card>
  );
};
