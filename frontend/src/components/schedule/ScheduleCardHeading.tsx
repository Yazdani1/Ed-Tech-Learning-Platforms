import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface ScheduleCardHeadingProps {
  title: string;
  description?: string | null;
}

/** Title and description at the top of a timer or reminder card (long words wrap on phones). */
export const ScheduleCardHeading: FC<ScheduleCardHeadingProps> = ({ title, description }) => (
  <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
    <Typography
      component="h3"
      variant="h6"
      sx={{ fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere' }}
    >
      {title}
    </Typography>
    {description && (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.25, overflowWrap: 'anywhere' }}
      >
        {description}
      </Typography>
    )}
  </Box>
);
