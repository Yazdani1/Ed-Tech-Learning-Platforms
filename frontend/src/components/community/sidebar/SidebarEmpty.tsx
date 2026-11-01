import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface SidebarEmptyProps {
  text: string;
}

/** The "nothing here yet" line of a sidebar card. */
export const SidebarEmpty: FC<SidebarEmptyProps> = ({ text }) => (
  <Typography variant="body2" color="text.secondary">
    {text}
  </Typography>
);
