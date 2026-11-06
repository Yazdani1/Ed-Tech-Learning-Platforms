import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

import type { FC } from 'react';

interface CourseStatBoxProps {
  value: string;
  label: string;
  /** Opens this page (no link without it) */
  href?: string;
  /** Accessible name of the link (the figure plus where it goes) */
  linkLabel?: string;
}

const BOX_SX = {
  display: 'block',
  p: 1.25,
  minHeight: 44,
  borderRadius: 1,
  bgcolor: 'action.hover',
  border: 1,
  borderColor: 'divider',
  color: 'inherit',
  textDecoration: 'none',
} as const;

/** A figure on a course card; with `href` it opens that page (the course's enrolments). */
export const CourseStatBox: FC<CourseStatBoxProps> = ({ value, label, href, linkLabel }) => {
  const content = (
    <>
      <Typography sx={{ fontWeight: 900, lineHeight: 1 }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </>
  );
  if (!href) return <Box sx={BOX_SX}>{content}</Box>;
  return (
    <Box
      component={Link}
      href={href}
      aria-label={`${value} ${label}. ${linkLabel ?? ''}`}
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
      {content}
    </Box>
  );
};
