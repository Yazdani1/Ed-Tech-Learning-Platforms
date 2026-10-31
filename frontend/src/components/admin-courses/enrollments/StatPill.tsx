import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface StatPillProps {
  label: string;
  value: string | number;
}

/** One figure of the enrolment statistics strip. */
export const StatPill: FC<StatPillProps> = ({ label, value }) => (
  <Box
    component="li"
    sx={{
      listStyle: 'none',
      px: 2,
      py: 1.25,
      borderRadius: 1,
      border: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
      minWidth: 0,
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1, overflowWrap: 'anywhere' }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);
