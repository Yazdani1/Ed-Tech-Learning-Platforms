import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** A number shown in a chip next to the title (e.g. how many students) */
  count?: number;
  /** Accessible name of the count chip (e.g. "120 students") */
  countLabel?: string;
  /** Buttons on the right (they wrap under the title on phones) */
  actions?: ReactNode;
}

/** The same title size on every dashboard page (h1, medium weight). */
export const PAGE_TITLE_SX = {
  fontSize: { xs: '1.25rem', sm: '1.375rem' },
  fontWeight: 700,
  lineHeight: 1.3,
} as const;

/** Every dashboard page's title row: the title (+ count) on the left, actions on the right. */
export const PageHeader: FC<PageHeaderProps> = ({ title, count, countLabel, actions }) => (
  <Box
    sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      mb: 2.5,
    }}
  >
    <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography component="h1" sx={PAGE_TITLE_SX}>
        {title}
      </Typography>
      {count !== undefined && (
        <Chip
          label={count.toLocaleString()}
          aria-label={countLabel}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      )}
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
  </Box>
);
