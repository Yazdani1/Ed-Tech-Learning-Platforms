'use client';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';

import { FilterPanelActions } from './FilterPanelActions';

import type { FC, ReactNode } from 'react';

interface FilterPanelProps {
  title: string;
  /** One line under the title (e.g. "3 of 40 users match your filters") */
  summary: string;
  activeCount: number;
  onClear: () => void;
  /** Extra chips next to the buttons (totals) */
  chips?: ReactNode;
  children: ReactNode;
  /** Open on first render (e.g. when the address bar already has filters) */
  defaultOpen?: boolean;
}

/** The collapsible "Filter ..." box above a list: summary, counts, Clear and Show/Hide filters. */
export const FilterPanel: FC<FilterPanelProps> = ({
  title,
  summary,
  activeCount,
  onClear,
  chips,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();

  return (
    <Paper variant="outlined" sx={{ mb: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {summary}
          </Typography>
        </Box>
        <FilterPanelActions
          activeCount={activeCount}
          onClear={onClear}
          open={open}
          onToggle={() => {
            setOpen((current) => !current);
          }}
          regionId={regionId}
          chips={chips}
        />
      </Box>
      <Collapse in={open} timeout="auto">
        <Box id={regionId} sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {children}
        </Box>
      </Collapse>
    </Paper>
  );
};
