'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTools } from '@/api/tools.api';
import { QueryState } from '@/components/common/QueryState';
import { SideDrawer } from '@/components/common/SideDrawer';
import { useOnOpen } from '@/hooks/useOnOpen';
import { EXTRAS_MAX_ITEMS } from '@/schemas/course-extras.schema';

import { ToolPickCard } from './ToolPickCard';

import type { Tool } from '@/schemas/tools.schema';
import type { FC } from 'react';

interface ToolPickerDrawerProps {
  open: boolean;
  /** Ids chosen so far */
  selected: readonly string[];
  onClose: () => void;
  onDone: (tools: Tool[]) => void;
}

const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
  gap: 1.5,
} as const;

/** Right-side panel with every tool (Course Setup > Tools) as a card; click to select one, several or all. */
export const ToolPickerDrawer: FC<ToolPickerDrawerProps> = ({
  open,
  selected,
  onClose,
  onDone,
}) => {
  const { t } = useTranslation();
  const query = useTools();
  const tools = query.data ?? [];
  const [chosen, setChosen] = useState<string[]>([]);
  useOnOpen(open, () => {
    setChosen([...selected]);
  });

  const toggle = (id: string): void => {
    setChosen((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={t('catalog.extras.tools.pickTitle')}
      onSave={() => {
        onDone(tools.filter((tool) => chosen.includes(tool._id)));
      }}
      saveLabel={t('catalog.extras.tools.pickDone', { count: chosen.length })}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('catalog.extras.tools.pickHint')}
      </Typography>
      <QueryState
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={tools.length === 0}
        emptyText={t('catalog.extras.tools.noTools')}
      >
        <Box sx={GRID_SX}>
          {tools.map((tool) => (
            <ToolPickCard
              key={tool._id}
              tool={tool}
              chosen={chosen.includes(tool._id)}
              // A course lists at most 30 tools (the server's limit)
              disabled={!chosen.includes(tool._id) && chosen.length >= EXTRAS_MAX_ITEMS}
              onToggle={() => {
                toggle(tool._id);
              }}
            />
          ))}
        </Box>
      </QueryState>
    </SideDrawer>
  );
};
