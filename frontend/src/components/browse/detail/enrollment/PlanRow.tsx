import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface PlanRowProps {
  label: string;
  plans: readonly string[];
  color: string;
}

/** "Your current plan  [Basic]" style line of the upgrade box. */
export const PlanRow: FC<PlanRowProps> = ({ label, plans, color }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1,
      mb: 0.75,
    }}
  >
    <Typography variant="caption" sx={{ color: 'grey.700' }}>
      {label}
    </Typography>
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {plans.map((plan) => (
        <Chip
          key={plan}
          label={plan}
          size="small"
          sx={{ bgcolor: color, color: 'common.white', fontWeight: 600, fontSize: '0.7rem' }}
        />
      ))}
    </Box>
  </Box>
);
