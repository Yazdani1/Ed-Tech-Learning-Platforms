import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface FormCardTitleProps {
  icon: ReactNode;
  children: ReactNode;
}

/** Heading of the "New Study Timer" / "New Reminder" cards (icon + text). */
export const FormCardTitle: FC<FormCardTitleProps> = ({ icon, children }) => (
  <Typography
    component="h2"
    variant="h6"
    sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
  >
    {icon}
    {children}
  </Typography>
);
