import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface ShowcasePanelProps {
  title: string;
  hint: string;
  /** Button on the right of the header (wraps under the text on phones) */
  action?: ReactNode;
  children: ReactNode;
}

/** An outlined section with a grey header (title + hint), as on the old showcase page. */
export const ShowcasePanel: FC<ShowcasePanelProps> = ({ title, hint, action, children }) => (
  <Paper component="section" variant="outlined" sx={{ overflow: 'hidden', mb: 3 }}>
    <Box
      sx={{
        px: 2,
        py: 1.5,
        bgcolor: 'grey.50',
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 260px' }}>
        <Typography component="h2" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      </Box>
      {action}
    </Box>
    {children}
  </Paper>
);
