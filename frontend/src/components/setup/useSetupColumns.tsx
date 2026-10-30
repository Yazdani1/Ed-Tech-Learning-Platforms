'use client';

import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SetupRowMenu } from './SetupRowMenu';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { SetupItem, SetupKind } from '@/schemas/setup.schema';

const DESCRIPTION_MAX_WIDTH = 320;
const ACTIONS_WIDTH = 64;

/** Columns of the course setup list (name, slug, description, row menu with Edit and Delete). */
export const useSetupColumns = (
  kind: SetupKind,
  onEdit: (item: SetupItem) => void,
): DataColumn<SetupItem>[] => {
  const { t } = useTranslation();

  return [
    {
      key: 'name',
      header: t('showcase.setup.name'),
      render: (item) => (
        <Typography variant="body2" sx={{ fontWeight: 650, overflowWrap: 'anywhere' }}>
          {item.name}
        </Typography>
      ),
    },
    {
      key: 'slug',
      header: t('showcase.setup.slug'),
      render: (item) => (
        <Chip label={item.slug} size="small" variant="outlined" sx={{ maxWidth: '100%' }} />
      ),
    },
    {
      key: 'description',
      header: t('showcase.setup.description'),
      render: (item) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: DESCRIPTION_MAX_WIDTH, overflowWrap: 'anywhere' }}
        >
          {item.description?.trim() ? item.description : t('showcase.setup.noDescription')}
        </Typography>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: ACTIONS_WIDTH,
      render: (item) => <SetupRowMenu kind={kind} item={item} onEdit={onEdit} />,
    },
  ];
};
