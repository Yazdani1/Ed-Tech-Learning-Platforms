import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { DISPLAY_FONT } from '@/theme/fonts';

import { SOFT_BORDER } from '../detail-styles';

import type { FC, ReactNode } from 'react';

interface DetailSectionProps {
  /** Used for the heading id (aria-labelledby) */
  id: string;
  title: string;
  description?: string;
  /**
   * A background colour for the whole screen width (no white card around the content); without it the
   * section is a white card in the page column.
   */
  band?: string;
  children: ReactNode;
}

const SECTION_GAP = { xs: 3, md: 4 } as const;
const CARD_SX = {
  p: { xs: 2, sm: 3, md: 4 },
  borderRadius: '18px',
  borderColor: SOFT_BORDER,
  boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
} as const;
const GAP_UNDER_HEADING = { xs: 2.5, md: 3.5 } as const;

/** A full-width block of the course page: centred heading, optional intro text, content. */
export const DetailSection: FC<DetailSectionProps> = ({
  id,
  title,
  description,
  band,
  children,
}) => {
  const body = (
    <>
      <Typography
        id={`${id}-heading`}
        component="h2"
        sx={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: { xs: '1.5rem', md: '2rem' },
          lineHeight: 1.25,
          textAlign: 'center',
          mb: description ? 1 : GAP_UNDER_HEADING,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          color="text.secondary"
          sx={{ mb: GAP_UNDER_HEADING, whiteSpace: 'pre-line', textAlign: 'center' }}
        >
          {description}
        </Typography>
      )}
      {children}
    </>
  );
  if (band) {
    return (
      <Box
        component="section"
        aria-labelledby={`${id}-heading`}
        sx={{ bgcolor: band, py: { xs: 4, md: 6 }, mb: SECTION_GAP }}
      >
        <Container maxWidth="lg">{body}</Container>
      </Box>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ mb: SECTION_GAP }}>
      <Paper component="section" variant="outlined" aria-labelledby={`${id}-heading`} sx={CARD_SX}>
        {body}
      </Paper>
    </Container>
  );
};

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
    gap: { xs: 2, md: 2.5 },
    p: 0,
    m: 0,
    listStyle: 'none',
  }) as const;
