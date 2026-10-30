import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface DateItemProps {
  label: string;
  value: string;
  icon: ReactNode;
}

/** A labelled date (start or end) on the course-type card. */
export const DateItem: FC<DateItemProps> = ({ label, value, icon }) => (
  <Box>
    <Typography
      variant="caption"
      sx={{
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        display: 'block',
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {icon}
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{value}</Typography>
    </Box>
  </Box>
);
