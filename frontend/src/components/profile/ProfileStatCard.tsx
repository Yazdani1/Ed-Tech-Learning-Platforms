import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface ProfileStatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  loading?: boolean;
}

/** One number of the profile summary row. */
export const ProfileStatCard: FC<ProfileStatCardProps> = ({
  icon,
  label,
  value,
  helper,
  loading = false,
}) => (
  <Paper variant="outlined" sx={{ p: 2.25, height: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }} aria-hidden>
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
    <Typography variant="h4" component="p" sx={{ fontWeight: 900, lineHeight: 1 }}>
      {loading ? <Skeleton width={56} /> : value}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
      {helper}
    </Typography>
  </Paper>
);
