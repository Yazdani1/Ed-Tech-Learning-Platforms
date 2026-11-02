import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

/** Strength of the card's tint (its colour at this opacity over white) */
const TINT = 0.1;
const BORDER_TINT = 0.35;
const ICON_SIZE = 40;

interface RevenuePeriodCardProps {
  /** "Today", "Last 7 days", ... */
  label: string;
  value: string;
  /** Smaller lines under the value (course / subscription split, enrolments) */
  details: readonly string[];
  /** Each card has its own colour (the tint and the icon; the text stays in the text colours) */
  color: string;
  icon: ReactNode;
}

/** One headline period (revenue of today, the last 7 days, this month or all time) on its own tinted card. */
export const RevenuePeriodCard: FC<RevenuePeriodCardProps> = ({
  label,
  value,
  details,
  color,
  icon,
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2.25,
      bgcolor: alpha(color, TINT),
      borderColor: alpha(color, BORDER_TINT),
      minWidth: 0,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Box
        aria-hidden
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.paper',
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
    </Box>
    <Typography
      component="p"
      variant="h5"
      sx={{ fontWeight: 900, mt: 1, overflowWrap: 'anywhere' }}
    >
      {value}
    </Typography>
    {details.map((line) => (
      <Typography key={line} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {line}
      </Typography>
    ))}
  </Paper>
);
