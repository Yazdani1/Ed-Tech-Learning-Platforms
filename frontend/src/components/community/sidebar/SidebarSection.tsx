import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useId } from 'react';

import type { FC, ReactNode } from 'react';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
}

/** A titled card in the hub's right column. */
export const SidebarSection: FC<SidebarSectionProps> = ({ title, children }) => {
  const headingId = useId();
  return (
    <Paper
      component="section"
      aria-labelledby={headingId}
      elevation={0}
      sx={{ p: 2, border: 1, borderColor: 'divider' }}
    >
      <Typography
        id={headingId}
        variant="subtitle1"
        component="h2"
        sx={{ fontWeight: 800, mb: 1.5 }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );
};
