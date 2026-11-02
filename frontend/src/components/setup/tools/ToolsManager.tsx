'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTranslation } from 'react-i18next';

import { useTools } from '@/api/tools.api';
import { QueryState } from '@/components/common/QueryState';
import { useModal } from '@/hooks/useModal';

import { SetupManagerHeader } from '../SetupManagerHeader';

import { ToolCard } from './ToolCard';
import { ToolFormModal } from './ToolFormModal';

import type { Tool } from '@/schemas/tools.schema';

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(3, minmax(0, 1fr))',
    md: 'repeat(5, minmax(0, 1fr))',
  },
  gap: 2,
} as const;

/** Course Setup > Tools: header with count and Add, the tools as a grid of logo cards, the form. */
export const ToolsManager = () => {
  const { t } = useTranslation();
  const query = useTools();
  const modal = useModal<Tool>();
  const tools = query.data ?? [];

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <SetupManagerHeader
        kind="tool"
        count={query.data?.length}
        onAdd={() => {
          modal.openModal();
        }}
      />
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <QueryState
          isLoading={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
          isEmpty={tools.length === 0}
          emptyText={t('showcase.setup.tool.empty')}
        >
          <Box
            component="ul"
            aria-label={t('showcase.setup.tool.plural')}
            sx={{ ...GRID_SX, p: 0, m: 0, listStyle: 'none' }}
          >
            {tools.map((tool) => (
              <li key={tool._id}>
                <ToolCard tool={tool} onEdit={modal.openModal} />
              </li>
            ))}
          </Box>
        </QueryState>
      </Box>
      <ToolFormModal open={modal.open} tool={modal.data} onClose={modal.closeModal} />
    </Card>
  );
};
