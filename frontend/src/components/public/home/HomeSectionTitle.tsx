import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface HomeSectionTitleProps {
  title: string;
  subtitle: string;
}

/** Centred title + subtitle at the top of a home course section. */
export const HomeSectionTitle: FC<HomeSectionTitleProps> = ({ title, subtitle }) => (
  <Box sx={{ textAlign: 'center', mb: { xs: 2.5, md: 3 } }}>
    <Typography
      variant="h4"
      component="h2"
      sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2rem' } }}
    >
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
      {subtitle}
    </Typography>
  </Box>
);
