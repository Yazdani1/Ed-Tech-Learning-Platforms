'use client';

import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { FC } from 'react';

interface SectionTitleBarProps {
  title: string;
  createLabel: string;
  onCreate: () => void;
}

/** Title of a settings section with its "Create New ..." button. */
export const SectionTitleBar: FC<SectionTitleBarProps> = ({ title, createLabel, onCreate }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
    <Typography variant="h6" component="h3" sx={{ fontWeight: 900 }}>
      {title}
    </Typography>
    <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} sx={{ minHeight: 44 }}>
      {createLabel}
    </Button>
  </Stack>
);
