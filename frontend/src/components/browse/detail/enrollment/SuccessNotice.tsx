import VerifiedIcon from '@mui/icons-material/Verified';
import Box from '@mui/material/Box';

import type { FC, ReactNode } from 'react';

interface SuccessNoticeProps {
  children: ReactNode;
}

/** Green "good news" box with a check badge (subscription covers the course, get it free). */
export const SuccessNotice: FC<SuccessNoticeProps> = ({ children }) => (
  <Box
    sx={{
      display: 'flex',
      gap: 1,
      alignItems: 'flex-start',
      bgcolor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: 1.5,
      p: 1.5,
      mb: 1.5,
    }}
  >
    <VerifiedIcon sx={{ color: '#16a34a', fontSize: 18, flexShrink: 0 }} aria-hidden />
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);
