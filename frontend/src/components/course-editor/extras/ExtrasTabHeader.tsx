'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface ExtrasTabHeaderProps {
  title: string;
  hint: string;
  /** Buttons on the right (Add, Save) */
  actions?: ReactNode;
}

/** Heading of a course page section tab: name, one-line hint, actions. */
export const ExtrasTabHeader: FC<ExtrasTabHeaderProps> = ({ title, hint, actions }) => (
  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      mb: 3,
    }}
  >
    <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
      <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {hint}
      </Typography>
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
  </Box>
);
