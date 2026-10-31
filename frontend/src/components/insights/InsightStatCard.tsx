import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface InsightStatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  helper?: string;
}

/** One headline number with its label and a short helper line (dashboard summary grid). */
export const InsightStatCard: FC<InsightStatCardProps> = ({ icon, label, value, helper }) => (
  <Paper
    variant="outlined"
    sx={{ p: 2.25, display: 'flex', gap: 1.5, alignItems: 'flex-start', minHeight: 116 }}
  >
    <Box
      aria-hidden
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
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" component="p" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.75 }}>
        {label}
      </Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
    </Box>
  </Paper>
);
