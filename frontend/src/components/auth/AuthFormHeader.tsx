import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface AuthFormHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

/** Icon, heading and one-line explanation above the sign-in and register forms. */
export const AuthFormHeader: FC<AuthFormHeaderProps> = ({ icon, title, subtitle }) => (
  <Box sx={{ textAlign: 'center', mb: 3.5 }}>
    <Box
      sx={{
        width: 54,
        height: 54,
        mx: 'auto',
        mb: 1.5,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
        color: 'primary.main',
      }}
    >
      {icon}
    </Box>
    <Typography component="h1" variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
      {subtitle}
    </Typography>
  </Box>
);
