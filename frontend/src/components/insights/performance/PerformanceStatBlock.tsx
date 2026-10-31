import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface PerformanceStatBlockProps {
  period: string;
  value: string;
  detail: string;
  label: string;
}

/** One number of the report: period, value, detail line and label. */
export const PerformanceStatBlock: FC<PerformanceStatBlockProps> = ({
  period,
  value,
  detail,
  label,
}) => (
  <Box
    sx={{
      minWidth: 0,
      '& + &': {
        borderLeft: { md: 1 },
        borderTop: { xs: 1, md: 0 },
        borderColor: 'divider',
        pl: { md: 5 },
        pt: { xs: 2, md: 0 },
      },
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {period}
    </Typography>
    <Typography component="p" variant="h4" sx={{ fontWeight: 700 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 500 }}>
      {detail}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
      {label}
    </Typography>
  </Box>
);
