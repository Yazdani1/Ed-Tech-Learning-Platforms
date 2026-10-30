import VerifiedIcon from '@mui/icons-material/Verified';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface CourseTypeBadgeProps {
  name: string;
  /** Placed over the top-left corner of a cover picture */
  overlay?: boolean;
}

/** Brand gradient used by the course-type badge (same colours as the old client). */
export const COURSE_TYPE_GRADIENT =
  'linear-gradient(90deg, #0f766e 0%, #7c3aed 40%, #0ea5e9 70%, #0f766e 100%)';

const OVERLAY_SX = {
  position: 'absolute',
  top: 10,
  left: 10,
  maxWidth: 'calc(100% - 20px)',
} as const;

/** The gradient "course type" label on course cards. */
export const CourseTypeBadge: FC<CourseTypeBadgeProps> = ({ name, overlay = false }) => (
  <Box
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 1.25,
      py: 0.5,
      borderRadius: 1,
      background: COURSE_TYPE_GRADIENT,
      backgroundSize: '250% auto',
      color: 'common.white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      maxWidth: '100%',
      ...(overlay ? OVERLAY_SX : {}),
    }}
  >
    <VerifiedIcon sx={{ fontSize: 13 }} aria-hidden />
    <Typography
      component="span"
      variant="caption"
      noWrap
      sx={{
        fontSize: '0.65rem',
        fontWeight: 800,
        letterSpacing: 0.75,
        lineHeight: 1,
        textTransform: 'uppercase',
      }}
    >
      {name}
    </Typography>
  </Box>
);
