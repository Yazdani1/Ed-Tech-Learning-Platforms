import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface OverviewStatProps {
  icon: ReactNode;
  label: string;
  value: string;
}

/** One number of the course overview (icon, value, label). */
export const OverviewStat: FC<OverviewStatProps> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
    <Box sx={{ color: 'primary.main', display: 'flex' }} aria-hidden>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  </Box>
);
