'use client';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import type { FC, ReactNode } from 'react';

interface TabSectionProps {
  title: string;
  /** "Post Announcement" style button on the right (hidden for users who may not add) */
  actionLabel?: string;
  onAction?: () => void;
  maxWidth?: number;
  children: ReactNode;
}

/** Frame of a player section: heading, optional add button, content. */
export const TabSection: FC<TabSectionProps> = ({
  title,
  actionLabel,
  onAction,
  maxWidth = 860,
  children,
}) => (
  <Box component="section" aria-label={title} sx={{ p: { xs: 2, md: 4 }, maxWidth }}>
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5,
        mb: 3,
      }}
    >
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAction}
          sx={{ minHeight: 44 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
    {children}
  </Box>
);
