import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface DashboardStatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  helper?: string;
  loading?: boolean;
}

/** A number or short value with its label (dashboard summary row). */
export const DashboardStatCard: FC<DashboardStatCardProps> = ({
  icon,
  label,
  value,
  helper,
  loading = false,
}) => (
  <Paper variant="outlined" sx={{ p: 2.25, display: 'flex', gap: 1.5, height: '100%' }}>
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        color: 'primary.main',
        flexShrink: 0,
      }}
      aria-hidden
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" component="p" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
        {loading ? <Skeleton width={48} /> : value}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.75 }}>
        {label}
      </Typography>
      {helper && !loading && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Box>
  </Paper>
);
