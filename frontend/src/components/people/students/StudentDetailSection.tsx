import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface StudentDetailSectionProps {
  title: string;
  children: ReactNode;
}

/** A titled block of the student details panel (contact, spending, courses, subscriptions). */
export const StudentDetailSection: FC<StudentDetailSectionProps> = ({ title, children }) => (
  <Box component="section" sx={{ mb: 3 }}>
    <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
      {title}
    </Typography>
    {children}
  </Box>
);
