import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

import type { FC } from 'react';

interface CourseStatBoxProps {
  value: string;
  label: string;
  href: string;
  /** Accessible name of the link (the figure plus where it goes) */
  linkLabel: string;
}

/** A figure on a course card that opens the course's enrolments. */
export const CourseStatBox: FC<CourseStatBoxProps> = ({ value, label, href, linkLabel }) => (
  <Box
    component={Link}
    href={href}
    aria-label={`${value} ${label}. ${linkLabel}`}
    sx={{
      display: 'block',
      p: 1.25,
      minHeight: 44,
      borderRadius: 1,
      bgcolor: 'action.hover',
      border: 1,
      borderColor: 'divider',
      color: 'inherit',
      textDecoration: 'none',
      '&:hover, &:focus-visible': { bgcolor: 'action.selected' },
    }}
  >
    <Typography sx={{ fontWeight: 900, lineHeight: 1 }}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
  </Box>
);
