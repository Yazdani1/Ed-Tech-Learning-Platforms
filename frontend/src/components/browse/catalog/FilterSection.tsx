import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface FilterSectionProps {
  label: string;
  children: ReactNode;
  /** No line under the last section */
  last?: boolean;
}

/** A titled block of the filter panel. */
export const FilterSection: FC<FilterSectionProps> = ({ label, children, last = false }) => (
  <Box
    component="section"
    sx={{ p: 2, borderBottom: last ? 'none' : '1px solid', borderColor: 'divider', flexShrink: 0 }}
  >
    <Typography
      component="h2"
      variant="caption"
      sx={{
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.75,
        color: 'text.secondary',
        display: 'block',
        mb: 1,
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);
