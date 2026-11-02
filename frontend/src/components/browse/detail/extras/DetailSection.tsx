import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface DetailSectionProps {
  /** Used for the heading id (aria-labelledby) */
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/** A course page block: heading, optional intro text, content. */
export const DetailSection: FC<DetailSectionProps> = ({ id, title, description, children }) => (
  <Box component="section" aria-labelledby={`${id}-heading`} sx={{ mb: 5 }}>
    <Typography
      id={`${id}-heading`}
      component="h2"
      variant="h6"
      sx={{ fontWeight: 800, mb: description ? 0.5 : 2 }}
    >
      {title}
    </Typography>
    {description && (
      <Typography color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
        {description}
      </Typography>
    )}
    {children}
  </Box>
);

/** Card grid used by the course page sections (1 column on phones, `columns` from tablets). */
export const gridSx = (columns: number) =>
  ({
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns}, minmax(0, 1fr))` },
    gap: 2,
    p: 0,
    m: 0,
    listStyle: 'none',
  }) as const;
