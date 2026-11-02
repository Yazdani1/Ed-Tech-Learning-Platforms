import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface DetailSectionProps {
  /** Used for the heading id (aria-labelledby) */
  id: string;
  title: string;
  description?: string;
  /** Heading and intro text centred (the FAQ) */
  centered?: boolean;
  children: ReactNode;
}

/** A course page block: heading, optional intro text, content. */
export const DetailSection: FC<DetailSectionProps> = ({
  id,
  title,
  description,
  centered = false,
  children,
}) => (
  <Box component="section" aria-labelledby={`${id}-heading`} sx={{ mb: 5 }}>
    <Typography
      id={`${id}-heading`}
      component="h2"
      variant="h6"
      sx={{
        fontWeight: 800,
        mb: description ? 0.5 : 2,
        textAlign: centered ? 'center' : undefined,
      }}
    >
      {title}
    </Typography>
    {description && (
      <Typography
        color="text.secondary"
        sx={{ mb: 2, whiteSpace: 'pre-line', textAlign: centered ? 'center' : undefined }}
      >
        {description}
      </Typography>
    )}
    {children}
  </Box>
);

/**
 * Card grid used by the course page sections: 1 column on phones, `columns` from tablets and `wideColumns`
 * (default the same) on wide screens, where the sections use the full page width.
 */
export const gridSx = (columns: number, wideColumns = columns) =>
  ({
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: `repeat(${String(columns)}, minmax(0, 1fr))`,
      lg: `repeat(${String(wideColumns)}, minmax(0, 1fr))`,
    },
    gap: 2,
    p: 0,
    m: 0,
    listStyle: 'none',
  }) as const;
