import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface ProfileInfoItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

/** An icon, a small upper-case label and its value. */
export const ProfileInfoItem: FC<ProfileInfoItemProps> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
    <Box sx={{ color: 'primary.main', display: 'flex', mt: 0.2 }} aria-hidden>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{value}</Typography>
    </Box>
  </Box>
);
