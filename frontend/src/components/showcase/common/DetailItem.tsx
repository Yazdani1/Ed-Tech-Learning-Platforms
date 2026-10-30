import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  children: ReactNode;
  /** Full width (otherwise a third of the row from 600 px up) */
  wide?: boolean;
}

/** A small caption with a bold value under it, in a details grid. */
export const DetailItem: FC<DetailItemProps> = ({ label, children, wide = false }) => (
  <Grid size={{ xs: 12, sm: wide ? 12 : 4 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Box sx={{ fontWeight: 800 }}>{children}</Box>
  </Grid>
);
