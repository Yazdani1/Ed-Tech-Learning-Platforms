import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface DetailItemProps {
  label: string;
  value: ReactNode;
}

/** One labelled value in a details dialog grid. */
export const DetailItem: FC<DetailItemProps> = ({ label, value }) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      px: 1.5,
      py: 1.25,
      minWidth: 0,
    }}
  >
    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
      {label}
    </Typography>
    <Box sx={{ mt: 0.5, fontSize: '0.925rem', fontWeight: 600, overflowWrap: 'anywhere' }}>
      {value}
    </Box>
  </Box>
);
