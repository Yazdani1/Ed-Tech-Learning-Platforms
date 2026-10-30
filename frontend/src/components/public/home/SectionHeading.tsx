import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** Right-hand action (e.g. "View all courses"); goes under the text on phones */
  action?: ReactNode;
}

/** Title + subtitle at the top of a home page section. */
export const SectionHeading: FC<SectionHeadingProps> = ({ title, subtitle, action }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: { xs: 'flex-start', md: 'flex-end' },
      flexDirection: { xs: 'column', md: 'row' },
      gap: 2,
      mb: { xs: 3, md: 4 },
    }}
  >
    <Box sx={{ maxWidth: 720 }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2.1rem' } }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Box>
);
