import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface PracticeFactProps {
  label: string;
  children: ReactNode;
}

const LABEL_SX = {
  fontSize: '0.62rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'text.secondary',
} as const;

/** A small labelled value of the course bar ("TOTAL QUIZ 5"). */
export const PracticeFact: FC<PracticeFactProps> = ({ label, children }) => (
  <Box sx={{ flexShrink: 0 }}>
    <Typography sx={LABEL_SX}>{label}</Typography>
    {children}
  </Box>
);
