import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Buttons on the right (they wrap under the title on phones) */
  actions?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
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
    <Box sx={{ minWidth: 0 }}>
      <Typography component="h1" variant="h5">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
  </Box>
);
